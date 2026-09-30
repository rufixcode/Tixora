<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_web_registration_uses_session_without_issuing_a_token(): void
    {
        $this->postJson('/web/register', [
            'name' => 'Student', 'email' => 'STUDENT@example.com',
            'password' => 'long-password-123', 'password_confirmation' => 'long-password-123',
        ])->assertCreated()->assertJsonPath('user.email', 'student@example.com')
            ->assertJsonMissingPath('token')->assertJsonMissingPath('user.password');
        $this->assertAuthenticated('web');
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->getJson('/web/me')->assertOk();
        $this->postJson('/web/logout')->assertOk();
        $this->getJson('/web/me')->assertUnauthorized();
    }

    public function test_mobile_login_issues_expiring_token_and_logout_revokes_it(): void
    {
        User::factory()->create(['email' => 'student@example.com', 'password' => 'long-password-123']);
        $response = $this->postJson('/api/login', ['email' => 'student@example.com', 'password' => 'long-password-123']);
        $response->assertOk()->assertJsonStructure(['token'])->assertJsonMissingPath('user.password');
        $this->assertNotNull(DB::table('personal_access_tokens')->first()->expires_at);
        $this->withToken($response->json('token'))->postJson('/api/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_booking_cannot_issue_unpaid_tickets(): void
    {
        $this->postJson('/api/events/anything/bookings', [])->assertUnauthorized();
        $this->actingAs(User::factory()->create())->postJson('/web/events/anything/bookings', [])->assertStatus(503);
        $this->assertDatabaseCount('bookings', 0);
        $this->assertDatabaseCount('tickets', 0);
    }

    public function test_search_filters_events_without_server_error(): void
    {
        DB::table('movies')->insert([
            'title' => 'Security Test Movie', 'description' => 'A searchable film',
            'duration_minutes' => 120, 'release_date' => '2026-09-30', 'status' => 'now_showing',
        ]);
        $this->getJson('/api/events?q=SECURITY')->assertOk()->assertJsonCount(1)
            ->assertJsonPath('0.booking_available', false);
        $this->getJson('/api/events?q=missing')->assertOk()->assertExactJson([]);
        $this->getJson('/api/events?q[]=invalid')->assertUnprocessable();
    }

    public function test_malformed_credentials_are_validation_errors(): void
    {
        $this->postJson('/web/login', ['email' => ['bad'], 'password' => 'anything'])
            ->assertUnprocessable();
    }

    public function test_web_writes_require_csrf_outside_test_bypass(): void
    {
        $this->app->instance('env', 'local');
        $this->postJson('/web/login', ['email' => 'student@example.com', 'password' => 'anything'])
            ->assertStatus(419);
    }
}
