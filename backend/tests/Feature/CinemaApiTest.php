<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CinemaApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_screenings_and_seats_are_returned_from_the_database(): void
    {
        $fixture = $this->cinemaFixture();

        $this->getJson('/api/movies/demo-movie/screenings')->assertOk()
            ->assertJsonPath('screenings.0.id', $fixture['screening'])
            ->assertJsonPath('screenings.0.cinema_name', 'Demo Cinema')
            ->assertJsonPath('screenings.0.available', true);

        $this->getJson('/api/screenings/'.$fixture['screening'].'/seats')->assertOk()
            ->assertJsonPath('max_seats_per_order', 8)
            ->assertJsonPath('seats.0.id', $fixture['seatOne'])
            ->assertJsonPath('seats.0.status', 'available');
    }

    public function test_hold_review_and_release_are_owned_and_server_validated(): void
    {
        $fixture = $this->cinemaFixture();
        Sanctum::actingAs(User::factory()->create());

        $hold = $this->postJson('/api/screenings/'.$fixture['screening'].'/holds', [
            'seat_ids' => [$fixture['seatOne'], $fixture['seatTwo']],
        ])->assertCreated()->assertJsonPath('total_amount', 500)->json('hold_token');

        $this->getJson('/api/screenings/'.$fixture['screening'].'/seats')->assertOk()
            ->assertJsonPath('seats.0.status', 'held');
        $this->postJson('/api/screenings/'.$fixture['screening'].'/review', ['hold_token' => $hold])
            ->assertOk()->assertJsonPath('valid', true)->assertJsonPath('seats.0.id', $fixture['seatOne']);
        $this->deleteJson('/api/screenings/'.$fixture['screening'].'/holds/'.$hold)->assertOk();
        $this->getJson('/api/screenings/'.$fixture['screening'].'/seats')->assertOk()
            ->assertJsonPath('seats.0.status', 'available');
    }

    private function cinemaFixture(): array
    {
        $now = now();
        $mall = DB::table('malls')->insertGetId(['name' => 'Demo Mall', 'address' => 'Address', 'city' => 'Davao City', 'created_at' => $now, 'updated_at' => $now]);
        $cinema = DB::table('cinemas')->insertGetId(['mall_id' => $mall, 'name' => 'Demo Cinema', 'created_at' => $now, 'updated_at' => $now]);
        $screen = DB::table('screens')->insertGetId(['cinema_id' => $cinema, 'name' => 'Screen 1', 'capacity' => 2, 'created_at' => $now, 'updated_at' => $now]);
        $movie = DB::table('movies')->insertGetId(['title' => 'Demo Movie', 'duration_minutes' => 100, 'release_date' => '2026-10-07', 'status' => 'now_showing', 'created_at' => $now, 'updated_at' => $now]);
        $screening = DB::table('screenings')->insertGetId(['movie_id' => $movie, 'screen_id' => $screen, 'start_time' => '2026-10-08 19:00:00', 'end_time' => '2026-10-08 20:40:00', 'ticket_price' => 250, 'status' => 'scheduled', 'created_at' => $now, 'updated_at' => $now]);
        $seatOne = DB::table('seats')->insertGetId(['screen_id' => $screen, 'row_label' => 'A', 'seat_number' => 1, 'seat_type' => 'regular', 'created_at' => $now, 'updated_at' => $now]);
        $seatTwo = DB::table('seats')->insertGetId(['screen_id' => $screen, 'row_label' => 'A', 'seat_number' => 2, 'seat_type' => 'regular', 'created_at' => $now, 'updated_at' => $now]);
        return compact('screening', 'seatOne', 'seatTwo');
    }
}
