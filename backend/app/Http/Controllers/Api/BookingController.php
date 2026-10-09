<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PayMongo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = DB::table('bookings')->where('user_id', $request->user()->id)->orderByDesc('id')->limit(100)->get();

        return response()->json($bookings->map(function ($b) {
            $b->total_amount = (float) $b->total_amount;
            $b->tickets = DB::table('tickets')->where('booking_id', $b->id)->get(['id', 'ticket_number', 'ticket_type', 'status', 'qr_code', 'issued_at', 'used_at'])->map(function ($ticket) use ($b) {
                $ticket->qr_payload = $b->status === 'confirmed' && $ticket->status === 'valid' ? 'tixora:ticket:'.$ticket->qr_code : null;
                unset($ticket->qr_code);
                $ticket->seat = DB::table('ticket_seats as ts')->join('seats as s', 's.id', '=', 'ts.seat_id')->where('ts.ticket_id', $ticket->id)->select('s.row_label', 's.seat_number')->first();

                return $ticket;
            });
            $b->seats = DB::table('booking_seats as bs')->join('seats as s', 's.id', '=', 'bs.seat_id')->where('bs.booking_id', $b->id)->get(['s.row_label', 's.seat_number']);

            return $b;
        }))->header('Cache-Control', 'no-store');
    }

    public function store(Request $request, string $slug, PayMongo $paymongo)
    {
        abort_unless($paymongo->ready(), 503, 'PayMongo sandbox is not configured yet.');
        $data = $request->validate(['request_key' => ['required', 'uuid'], 'ticket_type_id' => ['required', 'regex:/^ticket-[0-9]+$/'], 'quantity' => ['required', 'integer', 'min:1', 'max:8']]);
        $event = app(EventController::class)->catalog()->firstWhere('slug', $slug);
        abort_unless($event && $event['category'] !== 'Movies', 422, 'Choose a screening for movie seats.');
        $id = DB::transaction(function () use ($request, $data, $event) {
            DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
            $existing = DB::table('bookings')->where('user_id', $request->user()->id)->where('request_key', $data['request_key'])->first();
            if ($existing) {
                return $existing->id;
            }
            $this->limitPending($request);
            $source = DB::table($event['resource_type'] === 'concert' ? 'concerts' : 'events')->where('id', $event['resource_id'])->lockForUpdate()->first();
            abort_unless($source && $source->status !== 'cancelled' && now()->lt($source->start_time), 422, 'Event unavailable.');
            $column = $event['resource_type'].'_id';
            $tier = DB::table('ticket_types')->where('id', substr($data['ticket_type_id'], 7))->where($column, $event['resource_id'])->lockForUpdate()->first();
            abort_unless($tier && $tier->available_quantity >= $data['quantity'], 422, 'Not enough tickets available.');
            abort_unless($event['booking_available'], 422, 'This event is not available for booking.');
            $id = $this->insertBooking($request, $data['request_key'], $event['title'], $event['resource_type'], (int) round((float) $tier->price * 100) * $data['quantity']);
            DB::table('ticket_types')->where('id', $tier->id)->decrement('available_quantity', $data['quantity']);
            DB::table('booking_items')->insert(['booking_id' => $id, $column => $event['resource_id'], 'ticket_type_id' => $tier->id, 'quantity' => $data['quantity'], 'unit_price' => $tier->price, 'subtotal' => round((float) $tier->price * $data['quantity'], 2), 'created_at' => now(), 'updated_at' => now()]);

            return $id;
        });

        return $this->checkout($request, $id, $paymongo);
    }

    public function cinema(Request $request, int $screening, PayMongo $paymongo)
    {
        abort_unless($paymongo->ready(), 503, 'PayMongo sandbox is not configured yet.');
        $data = $request->validate(['request_key' => ['required', 'uuid'], 'hold_token' => ['required', 'uuid']]);
        $id = DB::transaction(function () use ($request, $screening, $data) {
            DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
            $existing = DB::table('bookings')->where('user_id', $request->user()->id)->where('request_key', $data['request_key'])->first();
            if ($existing) {
                return $existing->id;
            }
            $this->limitPending($request);
            $s = DB::table('screenings')->where('id', $screening)->lockForUpdate()->first();
            abort_unless($s && $s->status === 'scheduled' && now()->lt($s->start_time), 422, 'Screening unavailable.');
            $holds = DB::table('seat_holds')->where('screening_id', $screening)->where('user_id', $request->user()->id)->where('hold_token', $data['hold_token'])->where('expires_at', '>', now())->lockForUpdate()->get();
            abort_if($holds->isEmpty(), 422, 'Your seat hold has expired. Select seats again.');
            $seatIds = $holds->pluck('seat_id');
            abort_if(DB::table('booking_seats')->where('screening_id', $screening)->whereIn('seat_id', $seatIds)->exists() || DB::table('ticket_seats')->where('screening_id', $screening)->whereIn('seat_id', $seatIds)->exists(), 422, 'Seats are no longer available.');
            $title = DB::table('movies')->where('id', $s->movie_id)->value('title');
            $id = $this->insertBooking($request, $data['request_key'], $title, 'movie', (int) round((float) $s->ticket_price * 100) * $holds->count());
            DB::table('booking_items')->insert(['booking_id' => $id, 'screening_id' => $screening, 'quantity' => $holds->count(), 'unit_price' => $s->ticket_price, 'subtotal' => round((float) $s->ticket_price * $holds->count(), 2), 'created_at' => now(), 'updated_at' => now()]);
            foreach ($holds as $h) {
                DB::table('booking_seats')->insert(['booking_id' => $id, 'screening_id' => $screening, 'seat_id' => $h->seat_id]);
            }
            DB::table('seat_holds')->whereIn('id', $holds->pluck('id'))->delete();

            return $id;
        });

        return $this->checkout($request, $id, $paymongo);
    }

    private function limitPending(Request $request): void
    {
        abort_if(DB::table('bookings')->where('user_id', $request->user()->id)->where('status', 'pending')->count() >= 3, 422, 'Complete or cancel an existing pending booking first.');
    }

    private function insertBooking(Request $request, string $key, string $title, string $type, int $cents): int
    {
        abort_if($cents < 100 || $cents > 100000000, 422, 'This ticket price cannot be paid online.');

        return DB::table('bookings')->insertGetId(['user_id' => $request->user()->id, 'request_key' => $key, 'event_title' => $title, 'booking_reference' => 'TX-'.Str::upper(Str::random(16)), 'booking_type' => $type, 'status' => 'pending', 'total_amount' => $cents / 100, 'booked_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
    }

    public function checkout(Request $request, int $booking, PayMongo $paymongo)
    {
        $b = DB::transaction(function () use ($request, $booking, $paymongo) {
            $b = DB::table('bookings')->where('id', $booking)->where('user_id', $request->user()->id)->lockForUpdate()->first();
            abort_unless($b, 404);
            abort_unless($b->status === 'pending', 422, 'Booking is no longer awaiting payment.');
            if (! $b->payment_session_id) {
                $session = $paymongo->create($b);
                DB::table('bookings')->where('id', $b->id)->update(['payment_session_id' => $session['id'], 'checkout_url' => $session['attributes']['checkout_url'], 'updated_at' => now()]);
                $b = DB::table('bookings')->find($b->id);
            }

            return $b;
        });

        return response()->json(['booking_id' => $b->id, 'booking_reference' => $b->booking_reference, 'checkout_url' => $b->checkout_url, 'total_amount' => (float) $b->total_amount, 'status' => $b->status], 201)->header('Cache-Control', 'no-store');
    }

    public function cancel(Request $request, int $booking, PayMongo $paymongo)
    {
        return DB::transaction(function () use ($request, $booking, $paymongo) {
            $b = DB::table('bookings')->where('id', $booking)->where('user_id', $request->user()->id)->lockForUpdate()->first();
            abort_unless($b, 404);
            if ($b->status === 'cancelled') {
                return response()->json(['message' => 'Booking cancelled.']);
            }
            abort_unless($b->status === 'pending', 422, 'Paid bookings cannot be cancelled here.');
            // Resolve even an ambiguous creation timeout with the same provider idempotency key.
            if (! $b->payment_session_id) {
                $session = $paymongo->create($b);
                $b->payment_session_id = $session['id'];
                DB::table('bookings')->where('id', $b->id)->update(['payment_session_id' => $session['id'], 'checkout_url' => $session['attributes']['checkout_url']]);
            }
            $paymongo->expire($b->payment_session_id);
            $session = $paymongo->retrieve($b->payment_session_id);
            abort_unless(data_get($session, 'attributes.status') === 'expired' && ! $this->paid($session), 409, 'Payment may have completed. Refresh your bookings.');
            foreach (DB::table('booking_items')->where('booking_id', $b->id)->get() as $item) {
                if ($item->ticket_type_id) {
                    DB::table('ticket_types')->where('id', $item->ticket_type_id)->increment('available_quantity', $item->quantity);
                }
            }
            DB::table('booking_seats')->where('booking_id', $b->id)->delete();
            DB::table('bookings')->where('id', $b->id)->update(['status' => 'cancelled', 'updated_at' => now()]);

            return response()->json(['message' => 'Booking cancelled.']);
        });
    }

    private function paid(array $session): bool
    {
        return collect(data_get($session, 'attributes.payments', []))->contains(fn ($p) => data_get($p, 'attributes.status') === 'paid');
    }

    public function webhook(Request $request, PayMongo $paymongo)
    {
        abort_unless($paymongo->ready(), 503);
        $parts = [];
        foreach (explode(',', (string) $request->header('Paymongo-Signature')) as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) === 2) {
                $parts[$pair[0]] = $pair[1];
            }
        }
        $timestamp = $parts['t'] ?? '';
        abort_unless(ctype_digit($timestamp) && abs(time() - (int) $timestamp) <= 300 && hash_equals(hash_hmac('sha256', $timestamp.'.'.$request->getContent(), config('paymongo.webhook_secret')), $parts['te'] ?? ''), 401, 'Invalid webhook signature.');
        $event = $request->json('data');
        $attrs = data_get($event, 'attributes', $event);
        if (data_get($attrs, 'type') !== 'checkout_session.payment.paid') {
            return response()->json(['received' => true]);
        }
        abort_unless(data_get($attrs, 'livemode') === false, 422, 'Only sandbox events are accepted.');
        $sessionId = data_get($attrs, 'data.id');
        abort_unless(is_string($sessionId), 422);
        $session = $paymongo->retrieve($sessionId);
        DB::transaction(function () use ($session, $sessionId) {
            $b = DB::table('bookings')->where('payment_session_id', $sessionId)->lockForUpdate()->first();
            abort_unless($b, 409, 'Checkout has not been recorded yet. Retry delivery.');
            if ($b->status === 'confirmed') {
                return;
            }
            abort_unless($b->status === 'pending' && data_get($session, 'id') === $sessionId && data_get($session, 'attributes.livemode') === false, 409);
            $payments = collect(data_get($session, 'attributes.payments', []))->filter(fn ($p) => data_get($p, 'attributes.status') === 'paid' && data_get($p, 'attributes.currency') === 'PHP' && data_get($p, 'attributes.livemode') === false);
            abort_unless($payments->sum(fn ($p) => (int) data_get($p, 'attributes.amount')) === (int) round((float) $b->total_amount * 100), 422, 'Payment amount does not match.');
            $seats = DB::table('booking_seats')->where('booking_id', $b->id)->orderBy('id')->get();
            foreach (DB::table('booking_items')->where('booking_id', $b->id)->get() as $item) {
                for ($i = 0; $i < $item->quantity; $i++) {
                    $ticket = DB::table('tickets')->insertGetId(['booking_id' => $b->id, 'ticket_number' => 'TK-'.Str::upper(Str::random(20)), 'ticket_type' => $b->booking_type, 'status' => 'valid', 'qr_code' => Str::random(48), 'issued_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
                    if ($item->screening_id) {
                        DB::table('ticket_seats')->insert(['ticket_id' => $ticket, 'screening_id' => $item->screening_id, 'seat_id' => $seats[$i]->seat_id, 'created_at' => now(), 'updated_at' => now()]);
                    }
                }
            }
            DB::table('bookings')->where('id',$b->id)->update(['status' => 'confirmed', 'updated_at' => now()]);
        });

        return response()->json(['received' => true]);
    }
}
