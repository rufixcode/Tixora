<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_bootstrap_uses_hidden_password_and_does_not_overwrite_accounts(): void
    {
        Storage::fake('local');
        $this->artisan('tixora:admin-bootstrap', ['email' => 'admin@example.test'])
            ->expectsQuestion('Password (hidden)', 'SecureExample!Pass72')
            ->expectsQuestion('Confirm password (hidden)', 'SecureExample!Pass72')
            ->expectsConfirmation('Create the first administrator for admin@example.test in the currently configured database?', 'yes')
            ->assertSuccessful();
        $user = User::where('email', 'admin@example.test')->firstOrFail();
        $this->assertTrue($user->is_admin);
        $this->assertTrue(Hash::check('SecureExample!Pass72', $user->password));
        Storage::disk('local')->assertMissing('admin-login.txt');
        $hash = $user->password;
        $this->artisan('tixora:admin-create', ['email' => 'admin@example.test'])->assertFailed();
        $this->assertSame($hash, $user->fresh()->password);
    }

    public function test_admin_bootstrap_rejects_weak_password_and_mismatched_confirmation(): void
    {
        foreach (['short', 'SecureExample!Pass72'] as $password) {
            $this->artisan('tixora:admin-bootstrap', ['email' => 'admin@example.test'])
                ->expectsQuestion('Password (hidden)', $password)
                ->expectsQuestion('Confirm password (hidden)', 'different')
                ->assertFailed();
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_admin_bootstrap_requires_confirmation_and_cannot_promote_existing_users(): void
    {
        $this->artisan('tixora:admin-bootstrap', ['email' => 'admin@example.test'])
            ->expectsQuestion('Password (hidden)', 'SecureExample!Pass72')
            ->expectsQuestion('Confirm password (hidden)', 'SecureExample!Pass72')
            ->expectsConfirmation('Create the first administrator for admin@example.test in the currently configured database?', 'no')
            ->assertFailed();
        $user = User::factory()->create(['email' => 'admin@example.test']);
        $this->artisan('tixora:admin-bootstrap', ['email' => 'admin@example.test'])->assertFailed();
        $this->assertFalse($user->fresh()->is_admin);
    }

    public function test_login_changes_require_current_password_and_revoke_sessions(): void
    {
        $user = User::factory()->create(['password' => 'original-password']);
        $token = $user->createToken('phone')->plainTextToken;
        $this->withToken($token)->patchJson('/api/settings/credentials', ['email' => 'updated@example.test', 'current_password' => 'wrong'])->assertUnprocessable();
        $this->withToken($token)->patchJson('/api/settings/credentials', ['email' => 'updated@example.test', 'current_password' => 'original-password', 'password' => 'new-strong-password', 'password_confirmation' => 'new-strong-password'])->assertOk();
        $this->assertSame('updated@example.test', $user->fresh()->email);
        $this->assertTrue(Hash::check('new-strong-password', $user->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($user);

        return $user;
    }

    private function listing(string $category): array
    {
        return ['title' => $category.' show', 'category' => $category, 'subtitle' => 'An Artist', 'about' => 'Description', 'venue' => 'Hall', 'city' => 'Davao', 'date' => now()->addDays(3)->toDateString(), 'time' => '19:00', 'price' => 300, 'tickets' => 20];
    }

    public function test_each_category_can_be_created_updated_archived_and_republished(): void
    {
        $this->admin();
        foreach (['Concerts' => 'concert', 'Events' => 'event', 'Movies' => 'movie'] as $category => $type) {
            $data = $this->listing($category);
            $this->postJson('/api/admin/events', $data)->assertOk();
            $listing = collect($this->getJson('/api/admin/events')->assertOk()->json())->firstWhere('category', $category);
            $path = '/api/admin/events/'.$type.'/'.$listing['resource_id'];
            $data['price'] = 400;
            $this->patchJson($path, $data)->assertOk();
            $this->getJson('/web/events/'.$listing['slug'])->assertOk()->assertJsonPath('tiers.0.price', 400);
            if ($type === 'concert') {
                $this->getJson('/api/events/'.$listing['slug'])->assertJsonPath('admin_subtitle', 'An Artist');
            }
            $this->deleteJson($path)->assertOk();
            $this->getJson('/api/events/'.$listing['slug'])->assertNotFound();
            $archived = collect($this->getJson('/api/admin/events')->json())->firstWhere('resource_type', $type);
            $this->assertSame('cancelled', $archived['status']);
            $this->assertNotEmpty($archived['starts_at']);
            $this->patchJson($path, $data)->assertOk();
            $this->getJson('/api/events/'.$listing['slug'])->assertOk();
        }
    }

    public function test_reports_require_admin_and_never_return_credentials(): void
    {
        foreach (['overview', 'bookings', 'customers'] as $section) {
            $this->getJson('/api/admin/'.$section)->assertUnauthorized();
        }
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        foreach (['overview', 'bookings', 'customers'] as $section) {
            $this->getJson('/api/admin/'.$section)->assertForbidden();
        }
        $this->postJson('/api/admin/events', $this->listing('Events'))->assertForbidden();
        $this->patchJson('/api/admin/events/event/1', [])->assertForbidden();
        $this->deleteJson('/api/admin/events/event/1')->assertForbidden();
        $admin = $this->admin();
        User::factory()->count(22)->create();
        $this->getJson('/api/admin/customers')->assertOk()->assertJsonCount(20, 'data')->assertJsonMissingPath('data.0.password')->assertJsonMissingPath('data.0.remember_token');
        $this->getJson('/api/admin/customers?q='.urlencode($user->email))->assertJsonCount(1, 'data')->assertJsonPath('data.0.email', $user->email);
        $this->getJson('/api/admin/overview')->assertJsonPath('customers', 23);
        $this->actingAs($admin, 'web')->getJson('/web/admin/overview')->assertOk();
    }

    public function test_booking_reports_filter_and_protect_booked_listings(): void
    {
        $admin = $this->admin();
        $this->postJson('/api/admin/events', $this->listing('Events'))->assertOk();
        $event = DB::table('events')->first();
        $tier = DB::table('ticket_types')->first();
        $booking = DB::table('bookings')->insertGetId(['user_id' => $admin->id, 'booking_reference' => 'TEST-ADMIN', 'booking_type' => 'event', 'event_title' => $event->name, 'total_amount' => 300, 'status' => 'confirmed', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('booking_items')->insert(['booking_id' => $booking, 'event_id' => $event->id, 'ticket_type_id' => $tier->id, 'quantity' => 1, 'unit_price' => 300, 'subtotal' => 300]);
        $this->getJson('/api/admin/bookings?status=confirmed&q=TEST-ADMIN')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.checkout_url');
        $this->getJson('/api/admin/bookings?status=pending')->assertJsonCount(0, 'data');
        $this->getJson('/api/admin/overview')->assertJsonPath('confirmed_amount', 300);
        $this->deleteJson('/api/admin/events/event/'.$event->id)->assertUnprocessable();
        $this->patchJson('/api/admin/events/event/'.$event->id, $this->listing('Events'))->assertUnprocessable();
        $this->getJson('/api/events/events-show')->assertOk();
    }
}
