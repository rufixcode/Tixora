<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    private function authorizeAdmin(Request $r): void
    {
        abort_unless($r->user()->is_admin, 403, 'Administrator access required.');
    }

    public function index(Request $r)
    {
        $this->authorizeAdmin($r);

        return response()->json(app(EventController::class)->catalog(true))->header('Cache-Control', 'no-store');
    }

    public function overview(Request $r)
    {
        $this->authorizeAdmin($r);

        return response()->json([
            'customers' => DB::table('users')->where('is_admin', false)->count(),
            'bookings' => DB::table('bookings')->count(),
            'pending' => DB::table('bookings')->where('status', 'pending')->count(),
            'confirmed' => DB::table('bookings')->where('status', 'confirmed')->count(),
            'confirmed_amount' => (float) DB::table('bookings')->where('status', 'confirmed')->sum('total_amount'),
        ])->header('Cache-Control', 'no-store');
    }

    public function bookings(Request $r)
    {
        $this->authorizeAdmin($r);
        $v = $r->validate(['q' => ['nullable', 'string', 'max:200'], 'status' => ['nullable', Rule::in(['pending', 'confirmed', 'cancelled'])], 'page' => ['nullable', 'integer', 'min:1']]);
        $query = DB::table('bookings as b')->join('users as u', 'u.id', '=', 'b.user_id')
            ->select('b.id', 'b.booking_reference', 'b.event_title', 'b.status', 'b.total_amount', 'b.created_at', 'u.name as customer', 'u.email');
        if (! empty($v['status'])) {
            $query->where('b.status', $v['status']);
        }
        if (! empty($v['q'])) {
            $q = '%'.$v['q'].'%';
            $query->where(fn ($query) => $query->where('b.booking_reference', 'like', $q)->orWhere('b.event_title', 'like', $q)->orWhere('u.email', 'like', $q));
        }

        return response()->json($query->orderByDesc('b.id')->paginate(20))->header('Cache-Control', 'no-store');
    }

    public function customers(Request $r)
    {
        $this->authorizeAdmin($r);
        $v = $r->validate(['q' => ['nullable', 'string', 'max:200'], 'page' => ['nullable', 'integer', 'min:1']]);
        $query = DB::table('users')->select('id', 'name', 'email', 'is_admin', 'created_at');
        if (! empty($v['q'])) {
            $q = '%'.$v['q'].'%';
            $query->where(fn ($query) => $query->where('name', 'like', $q)->orWhere('email', 'like', $q));
        }

        return response()->json($query->orderByDesc('id')->paginate(20))->header('Cache-Control', 'no-store');
    }

    private function table(string $type): string
    {
        return match ($type) {
            'movie' => 'movies','concert' => 'concerts','event' => 'events', default => abort(404)
        };
    }

    public function store(Request $r)
    {
        $this->authorizeAdmin($r);

        return $this->save($r);
    }

    public function update(Request $r, string $type, int $id)
    {
        $this->authorizeAdmin($r);

        return $this->save($r, $type, $id);
    }

    private function ensureEditable(string $type, int $id): void
    {
        if ($type === 'movie') {
            DB::table('screenings')->where('movie_id', $id)->lockForUpdate()->get();
        }
        $query = DB::table('booking_items')->where($type === 'movie' ? 'screening_id' : $type.'_id', $id);
        if ($type === 'movie') {
            $query = DB::table('booking_items')->whereIn('screening_id', DB::table('screenings')->where('movie_id', $id)->select('id'));
        }
        abort_if($query->exists(), 422, 'This event has booking history. Contact support before changing or removing it.');
        if ($type === 'movie') {
            abort_if(DB::table('seat_holds')->whereIn('screening_id', DB::table('screenings')->where('movie_id', $id)->select('id'))->where('expires_at', '>', now())->exists(), 422, 'This movie has active seat holds.');
        }
    }

    private function save(Request $r, ?string $type = null, ?int $id = null)
    {
        $v = $r->validate(['title' => ['required', 'string', 'max:200'], 'category' => ['required', Rule::in(['Movies', 'Concerts', 'Events'])], 'subtitle' => ['nullable', 'string', 'max:255'], 'about' => ['required', 'string', 'max:10000'], 'venue' => ['required', 'string', 'max:200'], 'city' => ['required', 'string', 'max:100'], 'date' => ['required', 'date'], 'time' => ['required', 'date_format:H:i'], 'image' => ['nullable', 'url:https', 'max:2000'], 'price' => ['required', 'numeric', 'min:1', 'max:100000'], 'tickets' => ['required', 'integer', 'min:1', 'max:200']]);
        $kind = match ($v['category']) {
            'Movies' => 'movie','Concerts' => 'concert',default => 'event'
        };
        abort_if($type && $type !== $kind, 422, 'An existing event cannot change category.');
        $table = $this->table($kind);
        $start = Carbon::parse($v['date'].' '.$v['time']);
        abort_unless($start->isFuture(), 422, 'Choose a future date and time.');
        DB::transaction(function () use ($r, $v, $kind, $id, $table, $start) {
            // Serialize admin mutations; booking paths lock the source event below.
            DB::table('users')->where('id', $r->user()->id)->lockForUpdate()->first();
            if ($id) {
                abort_unless(DB::table($table)->where('id', $id)->lockForUpdate()->first(), 404);
                $this->ensureEditable($kind, $id);
            }
            $mall = DB::table('malls')->where('name', $v['venue'])->where('city', $v['city'])->first();
            $mallId = $mall?->id ?? DB::table('malls')->insertGetId(['name' => $v['venue'], 'city' => $v['city'], 'address' => $v['city'], 'created_at' => now(), 'updated_at' => now()]);
            $values = ['description' => $v['about'], 'poster_url' => $v['image'] ?? null, 'updated_at' => now()];
            if ($kind === 'movie') {
                $values += ['title' => $v['title'], 'release_date' => $start->toDateString(), 'status' => 'now_showing'];
            } else {
                $venue = DB::table('venues')->where('mall_id', $mallId)->where('name', $v['venue'])->first();
                $venueId = $venue?->id ?? DB::table('venues')->insertGetId(['mall_id' => $mallId, 'name' => $v['venue'], 'capacity' => $v['tickets'], 'created_at' => now(), 'updated_at' => now()]);
                $values += ['name' => $v['title'], 'venue_id' => $venueId, 'start_time' => $start, 'end_time' => $start->copy()->addHours(2), 'status' => 'upcoming'];
                if ($kind === 'concert') {
                    $values['artist'] = $v['subtitle'] ?? '';
                }
            }
            if ($id) {
                DB::table($table)->where('id', $id)->update($values);
            } else {
                $id = DB::table($table)->insertGetId([...$values, 'created_at' => now()]);
            }
            if ($kind === 'movie') {
                // Existing screening history is guarded above. Retire prior unsold screenings.
                DB::table('screenings')->where('movie_id', $id)->update(['status' => 'cancelled']);
                $cinema = DB::table('cinemas')->where('mall_id', $mallId)->first();
                $cinemaId = $cinema?->id ?? DB::table('cinemas')->insertGetId(['mall_id' => $mallId, 'name' => $v['venue'], 'created_at' => now(), 'updated_at' => now()]);
                $screen = DB::table('screens')->insertGetId(['cinema_id' => $cinemaId, 'name' => $v['title'].' screening', 'capacity' => $v['tickets'], 'created_at' => now(), 'updated_at' => now()]);
                for ($n = 0; $n < $v['tickets']; $n++) {
                    DB::table('seats')->insert(['screen_id' => $screen, 'row_label' => chr(65 + intdiv($n, 10)), 'seat_number' => $n % 10 + 1, 'seat_type' => 'regular', 'created_at' => now(), 'updated_at' => now()]);
                }
                DB::table('screenings')->insert(['movie_id' => $id, 'screen_id' => $screen, 'start_time' => $start, 'end_time' => $start->copy()->addHours(2), 'ticket_price' => $v['price'], 'status' => 'scheduled', 'created_at' => now(), 'updated_at' => now()]);
            } else {
                // Preserve existing tiers; adjust only the first tier in this simple editor.
                $tier = DB::table('ticket_types')->where($kind.'_id', $id)->orderBy('price')->orderBy('id')->first();
                $values = ['price' => $v['price'], 'quantity' => $v['tickets'], 'available_quantity' => $v['tickets'], 'updated_at' => now()];
                if ($tier) {
                    DB::table('ticket_types')->where('id', $tier->id)->update($values);
                } else {
                    DB::table('ticket_types')->insert([...$values, $kind.'_id' => $id, 'name' => 'General Admission', 'created_at' => now()]);
                }
            }
        });

        return response()->json(['message' => 'Event saved.']);
    }

    public function destroy(Request $r, string $type, int $id)
    {
        $this->authorizeAdmin($r);
        $table = $this->table($type);
        DB::transaction(function () use ($type, $id, $table) {
            abort_unless(DB::table($table)->where('id', $id)->lockForUpdate()->first(), 404);
            $this->ensureEditable($type, $id);
            DB::table($table)->where('id', $id)->update(['status' => 'cancelled', 'updated_at' => now()]);
            if ($type === 'movie') {
                DB::table('screenings')->where('movie_id', $id)->update(['status' => 'cancelled']);
            }
        });

        return response()->json(['message' => 'Event removed from the catalog.']);
    }
}
