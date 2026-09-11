<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(Request $request, string $slug)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'delivery' => ['nullable', 'string', 'max:120'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:20'],
            'ticket_type_id' => ['nullable', 'string', 'max:60'],
            'seats' => ['nullable', 'array'],
            'seats.*' => ['string', 'max:50'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Authentication required to create a booking.',
            ], 401);
        }

        $event = $this->resolveEvent($slug);

        if (!$event) {
            return response()->json([
                'message' => 'Event not found.',
            ], 404);
        }

        $quantity = max(1, (int) ($request->input('quantity', 1)));
        $delivery = trim((string) ($request->input('delivery', 'Mobile Entry')));

        $priceData = $this->resolvePriceData($event, $request->input('ticket_type_id'));

        $subtotal = round($priceData['price'] * $quantity, 2);
        $serviceFee = round($subtotal * 0.08, 2);
        $total = round($subtotal + $serviceFee, 2);

        $bookingReference = 'TX-' . strtoupper(Str::random(8));

        $bookingId = DB::table('bookings')->insertGetId([
            'user_id' => $user->id,
            'booking_reference' => $bookingReference,
            'booking_type' => $event['event_type'],
            'status' => 'confirmed',
            'total_amount' => $total,
            'booked_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('booking_items')->insert([
            'booking_id' => $bookingId,
            'screening_id' => $priceData['screening_id'],
            'concert_id' => $priceData['concert_id'],
            'event_id' => $priceData['event_id'],
            'ticket_type_id' => $priceData['ticket_type_id'],
            'quantity' => $quantity,
            'unit_price' => $priceData['price'],
            'subtotal' => $subtotal,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $tickets = [];
        for ($i = 0; $i < $quantity; $i++) {
            $tickets[] = [
                'booking_id' => $bookingId,
                'ticket_number' => 'TK-' . strtoupper(Str::random(10)),
                'ticket_type' => $priceData['ticket_name'],
                'status' => 'valid',
                'qr_code' => 'QR-' . strtoupper(Str::random(16)),
                'issued_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($tickets)) {
            DB::table('tickets')->insert($tickets);
        }

        return response()->json([
            'message' => 'Booking created successfully.',
            'booking_reference' => $bookingReference,
            'total_amount' => $total,
            'quantity' => $quantity,
            'event' => $event['title'],
            'delivery' => $delivery,
            'email' => $request->input('email'),
        ], 201);
    }

    private function resolveEvent(string $slug): ?array
    {
        $movie = DB::table('movies')->get()->first(function ($movie) use ($slug) {
            return Str::slug($movie->title) === $slug;
        });

        if ($movie) {
            $screening = DB::table('screenings as s')
                ->join('screens as sc', 'sc.id', '=', 's.screen_id')
                ->join('cinemas as c', 'c.id', '=', 'sc.cinema_id')
                ->join('malls as m', 'm.id', '=', 'c.mall_id')
                ->where('s.movie_id', $movie->id)
                ->select([
                    's.id as screening_id',
                    's.ticket_price',
                    'sc.name as screen_name',
                    'c.name as cinema_name',
                    'm.city',
                ])
                ->orderBy('s.start_time')
                ->first();

            return [
                'event_type' => 'movie',
                'title' => $movie->title,
                'screening_id' => $screening?->screening_id,
                'movie_id' => $movie->id,
                'price' => $screening ? (float) $screening->ticket_price : 0,
                'ticket_name' => 'Standard Admission',
            ];
        }

        $concert = DB::table('concerts as c')
            ->join('venues as v', 'v.id', '=', 'c.venue_id')
            ->join('malls as m', 'm.id', '=', 'v.mall_id')
            ->whereRaw("LOWER(REPLACE(c.name, ' ', '-')) = ?", [$slug])
            ->select([
                'c.id',
                'c.name',
                'c.artist',
                'v.name as venue_name',
                'm.city',
            ])
            ->first();

        if ($concert) {
            return [
                'event_type' => 'concert',
                'title' => $concert->name,
                'concert_id' => $concert->id,
                'price' => 0,
                'ticket_name' => 'Concert Ticket',
            ];
        }

        $event = DB::table('events as e')
            ->join('venues as v', 'v.id', '=', 'e.venue_id')
            ->join('malls as m', 'm.id', '=', 'v.mall_id')
            ->whereRaw("LOWER(REPLACE(e.name, ' ', '-')) = ?", [$slug])
            ->select([
                'e.id',
                'e.name',
                'v.name as venue_name',
                'm.city',
            ])
            ->first();

        if ($event) {
            return [
                'event_type' => 'event',
                'title' => $event->name,
                'event_id' => $event->id,
                'price' => 0,
                'ticket_name' => 'Event Ticket',
            ];
        }

        return null;
    }

    private function resolvePriceData(array $event, ?string $ticketTypeId): array
    {
        if ($event['event_type'] === 'movie') {
            return [
                'price' => (float) $event['price'],
                'ticket_name' => $event['ticket_name'],
                'screening_id' => $event['screening_id'],
                'concert_id' => null,
                'event_id' => null,
                'ticket_type_id' => null,
            ];
        }

        $ticketType = null;

        if ($ticketTypeId) {
            $parsedId = (int) Str::after($ticketTypeId, 'ticket-');

            if ($parsedId > 0) {
                $ticketType = DB::table('ticket_types')->where('id', $parsedId)->first();
            }
        }

        if (!$ticketType) {
            $ticketType = DB::table('ticket_types')
                ->where($event['event_type'] === 'concert' ? 'concert_id' : 'event_id', $event['event_type'] === 'concert' ? $event['concert_id'] : $event['event_id'])
                ->orderBy('price')
                ->first();
        }

        if (!$ticketType) {
            abort(422, 'No ticket type available for this event.');
        }

        return [
            'price' => (float) $ticketType->price,
            'ticket_name' => $ticketType->name,
            'screening_id' => null,
            'concert_id' => $event['event_type'] === 'concert' ? $event['concert_id'] : null,
            'event_id' => $event['event_type'] === 'event' ? $event['event_id'] : null,
            'ticket_type_id' => $ticketType->id,
        ];
    }
}
