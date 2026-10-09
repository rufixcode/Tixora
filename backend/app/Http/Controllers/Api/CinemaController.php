<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CinemaController extends Controller
{
    private const MAX_SEATS_PER_ORDER = 8;

    private const HOLD_MINUTES = 10;

    public function screenings(string $slug): JsonResponse
    {
        $movie = $this->movieForSlug($slug);
        if (! $movie) {
            return response()->json(['message' => 'Movie not found.'], 404);
        }

        $screenings = $this->screeningQuery()
            ->where('s.movie_id', $movie->id)
            ->orderBy('s.start_time')
            ->get()
            ->map(fn ($screening) => $this->screeningPayload($screening));

        return response()->json([
            'movie' => ['slug' => Str::slug($movie->title), 'title' => $movie->title],
            'screenings' => $screenings,
        ]);
    }

    public function seats(int $screening): JsonResponse
    {
        $screening = $this->findScreening($screening);
        if (! $screening) {
            return response()->json(['message' => 'Screening not found.'], 404);
        }

        return response()->json($this->seatInventoryPayload($screening));
    }

    public function hold(Request $request, int $screening): JsonResponse
    {
        $validated = $request->validate([
            'seat_ids' => ['required', 'array', 'min:1', 'max:'.self::MAX_SEATS_PER_ORDER],
            'seat_ids.*' => ['required', 'integer', 'distinct'],
        ]);

        try {
            $result = DB::transaction(function () use ($request, $screening, $validated) {
                DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
                $this->removeExpiredHolds();
                $screeningRecord = $this->findScreening($screening, true);
                if (! $screeningRecord) {
                    abort(404, 'Screening not found.');
                }
                if (($screeningRecord->status !== 'scheduled' || now()->gte($screeningRecord->start_time))) {
                    throw ValidationException::withMessages(['screening' => ['This screening is unavailable.']]);
                }

                abort_if(DB::table('seat_holds')->where('user_id', $request->user()->id)->where('expires_at', '>', now())->count() + count($validated['seat_ids']) > self::MAX_SEATS_PER_ORDER, 422, 'Release your existing seats before holding more.');
                $seatIds = $validated['seat_ids'];
                $seats = DB::table('seats')->where('screen_id', $screeningRecord->screen_id)
                    ->whereIn('id', $seatIds)->lockForUpdate()->orderBy('row_label')->orderBy('seat_number')->get();
                if ($seats->count() !== count($seatIds)) {
                    throw ValidationException::withMessages(['seat_ids' => ['One or more seats do not belong to this screening.']]);
                }

                $unavailable = DB::table('booking_seats')->where('screening_id', $screening)->whereIn('seat_id', $seatIds)->exists() || DB::table('ticket_seats')->where('screening_id', $screening)->whereIn('seat_id', $seatIds)->exists()
                    || DB::table('seat_holds')->where('screening_id', $screening)->whereIn('seat_id', $seatIds)->where('expires_at', '>', now())->exists();
                if ($unavailable) {
                    throw ValidationException::withMessages(['seat_ids' => ['One or more selected seats are no longer available.']]);
                }

                $holdToken = (string) Str::uuid();
                $expiresAt = now()->addMinutes(self::HOLD_MINUTES);
                foreach ($seats as $seat) {
                    DB::table('seat_holds')->insert([
                        'hold_token' => $holdToken, 'screening_id' => $screening, 'seat_id' => $seat->id,
                        'user_id' => $request->user()->id, 'expires_at' => $expiresAt, 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }

                return ['hold_token' => $holdToken, 'expires_at' => $expiresAt->toIso8601String(), 'seats' => $seats, 'screening' => $screeningRecord];
            });
        } catch (QueryException) {
            throw ValidationException::withMessages(['seat_ids' => ['One or more selected seats are no longer available.']]);
        }

        return response()->json([
            'hold_token' => $result['hold_token'], 'expires_at' => $result['expires_at'],
            'seats' => collect($result['seats'])->map(fn ($seat) => $this->seatPayload($seat, 'held')),
            'total_amount' => round(count($result['seats']) * (float) $result['screening']->ticket_price, 2),
        ], 201)->header('Cache-Control', 'no-store');
    }

    public function release(Request $request, int $screening, string $holdToken): JsonResponse
    {
        $deleted = DB::table('seat_holds')->where([
            'screening_id' => $screening, 'hold_token' => $holdToken, 'user_id' => $request->user()->id,
        ])->delete();
        if (! $deleted) {
            return response()->json(['message' => 'Active hold not found.'], 404);
        }

        return response()->json(['message' => 'Seat hold released.'])->header('Cache-Control', 'no-store');
    }

    public function review(Request $request, int $screening): JsonResponse
    {
        $validated = $request->validate(['hold_token' => ['required', 'uuid']]);
        $result = DB::transaction(function () use ($request, $screening, $validated) {
            $this->removeExpiredHolds();
            $screeningRecord = $this->findScreening($screening, true);
            if (! $screeningRecord || ($screeningRecord->status !== 'scheduled' || now()->gte($screeningRecord->start_time))) {
                throw ValidationException::withMessages(['screening' => ['This screening is unavailable.']]);
            }
            $seats = DB::table('seat_holds as h')->join('seats as seat', 'seat.id', '=', 'h.seat_id')
                ->where('h.screening_id', $screening)->where('h.hold_token', $validated['hold_token'])
                ->where('h.user_id', $request->user()->id)->where('h.expires_at', '>', now())
                ->lockForUpdate()->orderBy('seat.row_label')->orderBy('seat.seat_number')
                ->select(['seat.id', 'seat.row_label', 'seat.seat_number', 'seat.seat_type', 'h.expires_at'])->get();
            if ($seats->isEmpty()) {
                throw ValidationException::withMessages(['hold_token' => ['This seat hold has expired or is invalid.']]);
            }

            return ['screening' => $screeningRecord, 'seats' => $seats];
        });

        return response()->json([
            'valid' => true, 'screening' => $this->screeningPayload($result['screening']),
            'expires_at' => Carbon::parse($result['seats']->min('expires_at'))->toIso8601String(),
            'seats' => $result['seats']->map(fn ($seat) => $this->seatPayload($seat, 'held')),
            'total_amount' => round($result['seats']->count() * (float) $result['screening']->ticket_price, 2),
        ])->header('Cache-Control', 'no-store');
    }

    private function movieForSlug(string $slug): ?object
    {
        return DB::table('movies')->orderBy('id')->get()->first(fn ($movie) => Str::slug($movie->title) === $slug);
    }

    private function screeningQuery()
    {
        return DB::table('screenings as s')->join('movies as movie', 'movie.id', '=', 's.movie_id')
            ->join('screens as screen', 'screen.id', '=', 's.screen_id')->join('cinemas as cinema', 'cinema.id', '=', 'screen.cinema_id')
            ->join('malls as mall', 'mall.id', '=', 'cinema.mall_id')
            ->select(['s.id', 's.movie_id', 's.screen_id', 's.start_time', 's.end_time', 's.ticket_price', 's.status', 'movie.title as movie_title', 'screen.name as screen_name', 'cinema.id as cinema_id', 'cinema.name as cinema_name', 'mall.name as mall_name', 'mall.city']);
    }

    private function findScreening(int $id, bool $lock = false): ?object
    {
        $query = $this->screeningQuery()->where('s.id', $id);
        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function screeningPayload(object $screening): array
    {
        $available = ($screening->status === 'scheduled' && now()->lt($screening->start_time));
        $unavailableSeatIds = DB::table('ticket_seats')->where('screening_id', $screening->id)->pluck('seat_id')
            ->merge(DB::table('booking_seats')->where('screening_id', $screening->id)->pluck('seat_id'))
            ->merge(DB::table('seat_holds')->where('screening_id', $screening->id)->where('expires_at', '>', now())->pluck('seat_id'))->unique();

        return [
            'id' => $screening->id, 'cinema_id' => $screening->cinema_id, 'cinema_name' => $screening->cinema_name, 'mall_name' => $screening->mall_name, 'city' => $screening->city,
            'screen_name' => $screening->screen_name, 'start_time' => Carbon::parse($screening->start_time)->toIso8601String(),
            'end_time' => Carbon::parse($screening->end_time)->toIso8601String(), 'status' => $screening->status,
            'available' => $available, 'ticket_price' => (float) $screening->ticket_price,
            'available_seat_count' => max(0, DB::table('seats')->where('screen_id', $screening->screen_id)->count() - $unavailableSeatIds->count()),
        ];
    }

    private function seatInventoryPayload(object $screening): array
    {
        $this->removeExpiredHolds();
        $occupied = array_flip(DB::table('ticket_seats')->where('screening_id', $screening->id)->pluck('seat_id')->merge(DB::table('booking_seats')->where('screening_id', $screening->id)->pluck('seat_id'))->all());
        $held = array_flip(DB::table('seat_holds')->where('screening_id', $screening->id)->where('expires_at', '>', now())->pluck('seat_id')->all());
        $status = ($screening->status === 'scheduled' && now()->lt($screening->start_time)) ? 'available' : 'unavailable';
        $seats = DB::table('seats')->where('screen_id', $screening->screen_id)->orderBy('row_label')->orderBy('seat_number')->get()
            ->map(function ($seat) use ($occupied, $held, $status) {
                $seatStatus = isset($occupied[$seat->id]) ? 'occupied' : (isset($held[$seat->id]) ? 'held' : $status);

                return $this->seatPayload($seat, $seatStatus);
            });

        return [
            'screening' => $this->screeningPayload($screening), 'max_seats_per_order' => self::MAX_SEATS_PER_ORDER, 'seats' => $seats,
        ];
    }

    private function seatPayload(object $seat, string $status): array
    {
        return ['id' => $seat->id, 'row_label' => $seat->row_label, 'seat_number' => (int) $seat->seat_number, 'seat_type' => $seat->seat_type, 'status' => $status];
    }

    private function removeExpiredHolds(): void
    {
        DB::table('seat_holds')->where('expires_at', '<=', now())->delete();
    }
}
