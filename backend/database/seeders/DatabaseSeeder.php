<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo data must not be seeded outside local/testing environments.');
        }

        /*
        |--------------------------------------------------------------------------
        | USERS
        |--------------------------------------------------------------------------
        */

        $userId = DB::table('users')->insertGetId([
            'name' => 'Tixora Test User',
            'email' => 'test@tixora.com',
            'password' => Hash::make('password123'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | MALLS
        |--------------------------------------------------------------------------
        */

        $smMall = DB::table('malls')->insertGetId([
            'name' => 'SM Lanang Premier',
            'address' => 'J.P. Laurel Avenue',
            'city' => 'Davao City',
            'description' => 'A major shopping and entertainment destination in Davao City.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $abreezaMall = DB::table('malls')->insertGetId([
            'name' => 'Abreeza Mall',
            'address' => 'J.P. Laurel Avenue',
            'city' => 'Davao City',
            'description' => 'A modern lifestyle and entertainment mall in Davao City.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $gmall = DB::table('malls')->insertGetId([
            'name' => 'Gaisano Mall of Davao',
            'address' => 'J.P. Laurel Avenue',
            'city' => 'Davao City',
            'description' => 'Shopping, dining and entertainment destination.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | CINEMAS
        |--------------------------------------------------------------------------
        */

        $smCinema = DB::table('cinemas')->insertGetId([
            'mall_id' => $smMall,
            'name' => 'SM Lanang Cinema',
            'description' => 'Modern cinema complex featuring the latest movies.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $abreezaCinema = DB::table('cinemas')->insertGetId([
            'mall_id' => $abreezaMall,
            'name' => 'Abreeza Cinema',
            'description' => 'Cinema complex located inside Abreeza Mall.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | SCREENS
        |--------------------------------------------------------------------------
        */

        $screen1 = DB::table('screens')->insertGetId([
            'cinema_id' => $smCinema,
            'name' => 'Cinema 1',
            'capacity' => 60,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $screen2 = DB::table('screens')->insertGetId([
            'cinema_id' => $smCinema,
            'name' => 'Cinema 2',
            'capacity' => 80,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $screen3 = DB::table('screens')->insertGetId([
            'cinema_id' => $abreezaCinema,
            'name' => 'Cinema 1',
            'capacity' => 70,
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | SEATS
        |--------------------------------------------------------------------------
        */

        $screens = [
            $screen1 => ['rows' => 6, 'seats' => 10],
            $screen2 => ['rows' => 8, 'seats' => 10],
            $screen3 => ['rows' => 7, 'seats' => 10],
        ];

        foreach ($screens as $screenId => $config) {

            for ($row = 0; $row < $config['rows']; $row++) {

                $rowLabel = chr(65 + $row);

                for ($seat = 1; $seat <= $config['seats']; $seat++) {

                    $seatType = 'regular';

                    if ($row === $config['rows'] - 1) {
                        $seatType = 'premium';
                    }

                    DB::table('seats')->insert([
                        'screen_id' => $screenId,
                        'row_label' => $rowLabel,
                        'seat_number' => $seat,
                        'seat_type' => $seatType,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }


        /*
        |--------------------------------------------------------------------------
        | MOVIES
        |--------------------------------------------------------------------------
        */

        $dragonMovie = DB::table('movies')->insertGetId([
            'title' => 'How to Train Your Dragon',
            'description' => 'A young Viking forms an unexpected friendship with a dragon and changes his world forever.',
            'poster_url' => null,
            'duration_minutes' => 125,
            'genre' => 'Fantasy, Adventure',
            'rating' => 'PG',
            'release_date' => '2026-06-13',
            'status' => 'now_showing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $minecraftMovie = DB::table('movies')->insertGetId([
            'title' => 'A Minecraft Movie',
            'description' => 'A group of adventurers are transported into the blocky world of Minecraft.',
            'poster_url' => null,
            'duration_minutes' => 101,
            'genre' => 'Adventure, Comedy',
            'rating' => 'PG',
            'release_date' => '2026-04-04',
            'status' => 'now_showing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $batmanMovie = DB::table('movies')->insertGetId([
            'title' => 'The Batman',
            'description' => 'A mysterious crime investigation pushes Gotham’s vigilante to his limits.',
            'poster_url' => null,
            'duration_minutes' => 176,
            'genre' => 'Action, Crime',
            'rating' => 'PG-13',
            'release_date' => '2026-10-15',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $interstellarMovie = DB::table('movies')->insertGetId([
            'title' => 'Interstellar',
            'description' => 'Explorers travel beyond our galaxy in search of a future for humanity.',
            'poster_url' => null,
            'duration_minutes' => 169,
            'genre' => 'Science Fiction, Drama',
            'rating' => 'PG-13',
            'release_date' => '2026-09-20',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | SCREENINGS
        |--------------------------------------------------------------------------
        */

        $screening1 = DB::table('screenings')->insertGetId([
            'movie_id' => $dragonMovie,
            'screen_id' => $screen1,
            'start_time' => '2026-09-15 15:00:00',
            'end_time' => '2026-09-15 17:05:00',
            'ticket_price' => 250.00,
            'status' => 'scheduled',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $screening2 = DB::table('screenings')->insertGetId([
            'movie_id' => $dragonMovie,
            'screen_id' => $screen2,
            'start_time' => '2026-09-15 19:30:00',
            'end_time' => '2026-09-15 21:35:00',
            'ticket_price' => 250.00,
            'status' => 'scheduled',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('screenings')->insert([
            [
                'movie_id' => $minecraftMovie,
                'screen_id' => $screen3,
                'start_time' => '2026-09-15 14:00:00',
                'end_time' => '2026-09-15 15:41:00',
                'ticket_price' => 220.00,
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'movie_id' => $minecraftMovie,
                'screen_id' => $screen3,
                'start_time' => '2026-09-15 18:00:00',
                'end_time' => '2026-09-15 19:41:00',
                'ticket_price' => 220.00,
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'movie_id' => $batmanMovie,
                'screen_id' => $screen2,
                'start_time' => '2026-10-15 19:00:00',
                'end_time' => '2026-10-15 21:56:00',
                'ticket_price' => 280.00,
                'status' => 'scheduled',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | VENUES
        |--------------------------------------------------------------------------
        */

        $concertVenue = DB::table('venues')->insertGetId([
            'mall_id' => $smMall,
            'name' => 'SMX Convention Center Davao',
            'description' => 'Large indoor venue suitable for concerts and major events.',
            'capacity' => 5000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $eventVenue = DB::table('venues')->insertGetId([
            'mall_id' => $abreezaMall,
            'name' => 'Abreeza Activity Center',
            'description' => 'Multi-purpose event venue for seminars, workshops and community events.',
            'capacity' => 1500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | CONCERTS
        |--------------------------------------------------------------------------
        */

        $kpopConcert = DB::table('concerts')->insertGetId([
            'venue_id' => $concertVenue,
            'name' => 'Tixora Live: K-Pop Night 2026',
            'artist' => 'Various K-Pop Artists',
            'description' => 'An exciting night featuring performances inspired by the biggest K-Pop acts.',
            'poster_url' => null,
            'start_time' => '2026-09-25 19:00:00',
            'end_time' => '2026-09-25 22:30:00',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $rockConcert = DB::table('concerts')->insertGetId([
            'venue_id' => $concertVenue,
            'name' => 'Davao Rock Festival 2026',
            'artist' => 'Local and International Rock Artists',
            'description' => 'A full-day celebration of rock music featuring multiple performers.',
            'poster_url' => null,
            'start_time' => '2026-10-10 17:00:00',
            'end_time' => '2026-10-10 23:00:00',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | EVENTS
        |--------------------------------------------------------------------------
        */

        $seminar = DB::table('events')->insertGetId([
            'venue_id' => $eventVenue,
            'name' => 'Future Tech Philippines 2026',
            'description' => 'A technology conference covering software development, AI and emerging technologies.',
            'poster_url' => null,
            'start_time' => '2026-10-05 09:00:00',
            'end_time' => '2026-10-05 17:00:00',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $workshop = DB::table('events')->insertGetId([
            'venue_id' => $eventVenue,
            'name' => 'Creative Workshop 2026',
            'description' => 'A hands-on workshop focused on creativity, design and digital skills.',
            'poster_url' => null,
            'start_time' => '2026-10-12 10:00:00',
            'end_time' => '2026-10-12 16:00:00',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $comedy = DB::table('events')->insertGetId([
            'venue_id' => $eventVenue,
            'name' => 'Comedy Night Davao',
            'description' => 'An evening of live stand-up comedy featuring talented comedians.',
            'poster_url' => null,
            'start_time' => '2026-09-30 19:30:00',
            'end_time' => '2026-09-30 22:00:00',
            'status' => 'upcoming',
            'created_at' => now(),
            'updated_at' => now(),
        ]);


        /*
        |--------------------------------------------------------------------------
        | TICKET TYPES
        |--------------------------------------------------------------------------
        */

        DB::table('ticket_types')->insert([
            [
                'concert_id' => $kpopConcert,
                'event_id' => null,
                'name' => 'General Admission',
                'description' => 'Standard concert admission.',
                'price' => 800.00,
                'quantity' => 500,
                'available_quantity' => 500,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => $kpopConcert,
                'event_id' => null,
                'name' => 'VIP',
                'description' => 'VIP access with premium viewing area.',
                'price' => 1500.00,
                'quantity' => 100,
                'available_quantity' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => $kpopConcert,
                'event_id' => null,
                'name' => 'VVIP',
                'description' => 'Premium VVIP concert experience.',
                'price' => 2500.00,
                'quantity' => 30,
                'available_quantity' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => $rockConcert,
                'event_id' => null,
                'name' => 'General Admission',
                'description' => 'Standard festival admission.',
                'price' => 600.00,
                'quantity' => 1000,
                'available_quantity' => 1000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => $rockConcert,
                'event_id' => null,
                'name' => 'VIP',
                'description' => 'VIP access to the festival.',
                'price' => 1200.00,
                'quantity' => 200,
                'available_quantity' => 200,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => null,
                'event_id' => $seminar,
                'name' => 'Regular',
                'description' => 'Regular conference admission.',
                'price' => 500.00,
                'quantity' => 500,
                'available_quantity' => 500,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => null,
                'event_id' => $seminar,
                'name' => 'Student',
                'description' => 'Discounted student admission.',
                'price' => 300.00,
                'quantity' => 300,
                'available_quantity' => 300,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => null,
                'event_id' => $workshop,
                'name' => 'Workshop Pass',
                'description' => 'Full workshop admission.',
                'price' => 750.00,
                'quantity' => 100,
                'available_quantity' => 100,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'concert_id' => null,
                'event_id' => $comedy,
                'name' => 'General Admission',
                'description' => 'Standard comedy show admission.',
                'price' => 400.00,
                'quantity' => 300,
                'available_quantity' => 300,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | FAVORITES
        |--------------------------------------------------------------------------
        */

        DB::table('favorites')->insert([
            [
                'user_id' => $userId,
                'favoritable_type' => 'movie',
                'favoritable_id' => $dragonMovie,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'user_id' => $userId,
                'favoritable_type' => 'concert',
                'favoritable_id' => $kpopConcert,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);


        /*
        |--------------------------------------------------------------------------
        | DONE
        |--------------------------------------------------------------------------
        */

        $this->command->info('Tixora database seeded successfully!');
    }
}