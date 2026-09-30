<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['q' => ['nullable', 'string', 'max:200'], 'category' => ['nullable', 'in:Movies,Concerts,Events'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $events = $this->allEvents();

        if ($request->filled('category')) {
            $events = $events->filter(fn ($event) => $event['category'] === $request->query('category'));
        }

        if ($request->filled('q')) {
            $needle = Str::of((string) $request->query('q'))
                ->trim()
                ->lower()
                ->toString();

            $events = $events->filter(function ($event) use ($needle) {
                if ($needle === '') {
                    return true;
                }

                $haystack = Str::lower(collect([
                    $event['title'],
                    $event['subtitle'],
                    $event['venue'],
                    $event['city'],
                    $event['category'],
                ])->join(' '));

                return Str::contains($haystack, $needle);
            });
        }

        if ($request->boolean('featured')) {
            $events = $events->filter(fn ($event) => (bool) $event['featured']);
        }

        if ($request->filled('limit')) {
            $limit = (int) $request->query('limit');

            if ($limit > 0) {
                $events = $events->take($limit);
            }
        }

        return response()->json($events->values()->all());
    }

    public function show(string $slug)
    {
        $event = $this->allEvents()->first(fn ($item) => $item['slug'] === $slug);

        if (! $event) {
            return response()->json([
                'message' => 'Event not found.',
            ], 404);
        }

        return response()->json($event);
    }

    private function allEvents()
    {
        $events = collect();

        foreach ($this->movies() as $movie) {
            $events->push($movie);
        }

        foreach ($this->concerts() as $concert) {
            $events->push($concert);
        }

        foreach ($this->genericEvents() as $entry) {
            $events->push($entry);
        }

        return $events->map(fn ($event) => [...$event, 'booking_available' => false])->values();
    }

    private function movies(): array
    {
        $movies = DB::table('movies')->orderBy('title')->get();
        $collection = [];

        foreach ($movies as $movie) {
            $screenings = DB::table('screenings as s')
                ->join('screens as sc', 'sc.id', '=', 's.screen_id')
                ->join('cinemas as c', 'c.id', '=', 'sc.cinema_id')
                ->join('malls as m', 'm.id', '=', 'c.mall_id')
                ->where('s.movie_id', $movie->id)
                ->select([
                    's.id as screening_id',
                    's.start_time',
                    's.end_time',
                    's.ticket_price',
                    'sc.name as screen_name',
                    'c.name as cinema_name',
                    'm.name as mall_name',
                    'm.city',
                    'sc.capacity',
                ])
                ->orderBy('s.start_time')
                ->get();

            $screenings = $screenings->map(function ($screening) {
                $screening->ticket_price = (float) $screening->ticket_price;
                $screening->capacity = (int) $screening->capacity;

                return $screening;
            });

            $firstScreening = $screenings->first();

            $collection[] = [
                'slug' => Str::slug($movie->title),
                'title' => $movie->title,
                'subtitle' => $movie->description ?: 'Now showing in cinemas near you.',
                'category' => 'Movies',
                'venue' => $firstScreening ? ($firstScreening->cinema_name ?? 'Cinema') : 'Cinema',
                'city' => $firstScreening ? ($firstScreening->city ?? 'Davao City') : 'Davao City',
                'date' => $firstScreening ? Carbon::parse($firstScreening->start_time)->format('M d, Y') : Carbon::parse($movie->release_date)->format('M d, Y'),
                'time' => $firstScreening ? Carbon::parse($firstScreening->start_time)->format('g:i A') : '',
                'image' => null,
                'badge' => $movie->status === 'now_showing' ? 'HOT' : 'NEW',
                'rating' => null,
                'reviews' => null,
                'featured' => $movie->status === 'now_showing',
                'seating' => 'cinema',
                'about' => $movie->description ?: 'Catch this movie in cinemas near you.',
                'tiers' => [
                    [
                        'id' => 'movie-'.$movie->id,
                        'name' => 'Standard Admission',
                        'price' => $firstScreening ? (float) $firstScreening->ticket_price : 0,
                        'note' => $firstScreening
                            ? 'Showing at '.$firstScreening->screen_name.' • '.$firstScreening->cinema_name
                            : 'Reserved seating movie experience',
                        'remaining' => $firstScreening ? max(1, $firstScreening->capacity) : 1,
                    ],
                ],
            ];
        }

        return $collection;
    }

    private function concerts(): array
    {
        $concerts = DB::table('concerts as c')
            ->join('venues as v', 'v.id', '=', 'c.venue_id')
            ->join('malls as m', 'm.id', '=', 'v.mall_id')
            ->select([
                'c.id',
                'c.name',
                'c.artist',
                'c.description',
                'c.start_time',
                'c.end_time',
                'c.status',
                'v.name as venue_name',
                'm.city',
            ])
            ->orderBy('c.start_time')
            ->get();

        $collection = [];

        foreach ($concerts as $concert) {
            $ticketTypes = DB::table('ticket_types')
                ->where('concert_id', $concert->id)
                ->orderBy('price')
                ->get();

            $collection[] = [
                'slug' => Str::slug($concert->name),
                'title' => $concert->name,
                'subtitle' => $concert->artist ? 'Featuring '.$concert->artist : 'Live music experience',
                'category' => 'Concerts',
                'venue' => $concert->venue_name,
                'city' => $concert->city,
                'date' => Carbon::parse($concert->start_time)->format('M d, Y'),
                'time' => Carbon::parse($concert->start_time)->format('g:i A'),
                'image' => null,
                'badge' => 'NEW',
                'rating' => null,
                'reviews' => null,
                'featured' => false,
                'seating' => 'arena',
                'about' => $concert->description ?: 'An unforgettable live performance in Davao.',
                'tiers' => $ticketTypes->map(function ($ticketType) {
                    return [
                        'id' => 'ticket-'.$ticketType->id,
                        'name' => $ticketType->name,
                        'price' => (float) $ticketType->price,
                        'note' => $ticketType->description ?: 'Premium concert access',
                        'remaining' => (int) $ticketType->available_quantity,
                    ];
                })->values()->all(),
            ];
        }

        return $collection;
    }

    private function genericEvents(): array
    {
        $events = DB::table('events as e')
            ->join('venues as v', 'v.id', '=', 'e.venue_id')
            ->join('malls as m', 'm.id', '=', 'v.mall_id')
            ->select([
                'e.id',
                'e.name',
                'e.description',
                'e.start_time',
                'e.end_time',
                'e.status',
                'v.name as venue_name',
                'm.city',
            ])
            ->orderBy('e.start_time')
            ->get();

        $collection = [];

        foreach ($events as $event) {
            $ticketTypes = DB::table('ticket_types')
                ->where('event_id', $event->id)
                ->orderBy('price')
                ->get();

            $collection[] = [
                'slug' => Str::slug($event->name),
                'title' => $event->name,
                'subtitle' => $event->description ?: 'Community events and experiences',
                'category' => 'Events',
                'venue' => $event->venue_name,
                'city' => $event->city,
                'date' => Carbon::parse($event->start_time)->format('M d, Y'),
                'time' => Carbon::parse($event->start_time)->format('g:i A'),
                'image' => null,
                'badge' => 'NEW',
                'rating' => null,
                'reviews' => null,
                'featured' => false,
                'seating' => null,
                'about' => $event->description ?: 'A curated event experience for you.',
                'tiers' => $ticketTypes->map(function ($ticketType) {
                    return [
                        'id' => 'ticket-'.$ticketType->id,
                        'name' => $ticketType->name,
                        'price' => (float) $ticketType->price,
                        'note' => $ticketType->description ?: 'Event access',
                        'remaining' => (int) $ticketType->available_quantity,
                    ];
                })->values()->all(),
            ];
        }

        return $collection;
    }
}
