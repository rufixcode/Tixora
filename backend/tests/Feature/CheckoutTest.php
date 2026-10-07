<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['paymongo.secret_key' => 'sk_test_fixture', 'paymongo.webhook_secret' => 'test-webhook-secret']);
        Http::preventStrayRequests();
    }

    private function catalog(): array
    {
        $mall = DB::table('malls')->insertGetId(['name' => 'Mall', 'city' => 'Davao', 'address' => 'Address']);
        $venue = DB::table('venues')->insertGetId(['mall_id' => $mall, 'name' => 'Hall']);
        $event = DB::table('events')->insertGetId(['venue_id' => $venue, 'name' => 'Test Show', 'start_time' => now()->addDay(), 'end_time' => now()->addDays(2), 'status' => 'upcoming']);
        $tier = DB::table('ticket_types')->insertGetId(['event_id' => $event, 'name' => 'General', 'price' => 250, 'quantity' => 4, 'available_quantity' => 4]);

        return compact('event', 'tier');
    }

    private function fakeSession(bool $paid = false, string $status = 'active', int $amount = 50000): void
    {
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake(['api.paymongo.com/*' => Http::response(['data' => ['id' => 'cs_test', 'attributes' => [
            'checkout_url' => 'https://checkout.paymongo.com/cs_test', 'livemode' => false, 'status' => $status,
            'payments' => $paid ? [['id' => 'pay_test', 'attributes' => ['status' => 'paid', 'amount' => $amount, 'currency' => 'PHP', 'livemode' => false]]] : [],
        ]]])]);
    }

    private function order(int $tier, ?string $key = null)
    {
        return $this->postJson('/api/events/test-show/bookings', ['ticket_type_id' => 'ticket-'.$tier, 'quantity' => 2, 'request_key' => $key ?? (string) Str::uuid(), 'total_amount' => 1]);
    }

    private function webhook(bool $valid = true)
    {
        $raw = json_encode(['data' => ['id' => 'evt_test', 'attributes' => ['type' => 'checkout_session.payment.paid', 'livemode' => false, 'data' => ['id' => 'cs_test']]]]);
        $t = (string) time();
        $sig = hash_hmac('sha256', $t.'.'.$raw, 'test-webhook-secret');

        return $this->call('POST', '/api/payments/paymongo/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json', 'HTTP_PAYMONGO_SIGNATURE' => 't='.$t.',te='.($valid ? $sig : 'invalid')], $raw);
    }

    public function test_checkout_uses_server_price_and_retries_do_not_double_reserve(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $key = (string) Str::uuid();
        $this->order($f['tier'], $key)->assertCreated()->assertJsonPath('total_amount', 500)->assertJsonPath('status', 'pending');
        $this->order($f['tier'], $key)->assertCreated();
        $this->assertDatabaseCount('bookings', 1);
        $this->assertDatabaseCount('tickets', 0);
        $this->assertDatabaseHas('ticket_types', ['id' => $f['tier'], 'available_quantity' => 2]);
        Http::assertSentCount(1);
        Http::assertSent(fn ($r) => $r['data']['attributes']['line_items'][0]['amount'] === 50000);
    }

    public function test_only_verified_payment_issues_tickets_and_duplicate_webhooks_are_safe(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $this->order($f['tier'])->assertCreated();
        $this->webhook(false)->assertUnauthorized();
        $this->assertDatabaseCount('tickets', 0);
        $this->fakeSession(true);
        $this->webhook()->assertOk();
        $this->webhook()->assertOk();
        $this->assertDatabaseCount('tickets', 2);
        $this->assertDatabaseHas('bookings', ['status' => 'confirmed']);
    }

    public function test_wrong_payment_amount_does_not_issue_tickets(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $this->order($f['tier'])->assertCreated();
        $this->fakeSession(true, 'active', 100);
        $this->webhook()->assertUnprocessable();
        $this->assertDatabaseCount('tickets', 0);
    }

    public function test_cancellation_closes_checkout_before_releasing_inventory(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $id = $this->order($f['tier'])->assertCreated()->json('booking_id');
        $this->fakeSession(false, 'expired');
        $this->postJson('/api/bookings/'.$id.'/cancel')->assertOk();
        $this->assertDatabaseHas('ticket_types', ['id' => $f['tier'], 'available_quantity' => 4]);
        $this->postJson('/api/bookings/'.$id.'/cancel')->assertOk();
        $this->assertDatabaseHas('ticket_types', ['id' => $f['tier'], 'available_quantity' => 4]);
    }

    public function test_other_users_cannot_access_or_cancel_an_order(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $id = $this->order($f['tier'])->assertCreated()->json('booking_id');
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/bookings')->assertExactJson([]);
        $this->postJson('/api/bookings/'.$id.'/checkout')->assertNotFound();
        $this->postJson('/api/bookings/'.$id.'/cancel')->assertNotFound();
    }

    public function test_unrelated_ticket_tier_and_overselling_are_rejected(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->fakeSession();
        $this->order($f['tier'] + 100)->assertUnprocessable();
        DB::table('ticket_types')->where('id', $f['tier'])->update(['available_quantity' => 1]);
        $this->order($f['tier'])->assertUnprocessable();
        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_live_keys_are_rejected_before_inventory_is_reserved(): void
    {
        $f = $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        config(['paymongo.secret_key' => 'sk_live_fixture']);
        $this->order($f['tier'])->assertStatus(503);
        $this->assertDatabaseCount('bookings', 0);
        Http::assertNothingSent();
    }

    public function test_admin_is_server_authorized_and_catalog_is_shared(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->getJson('/api/admin/events')->assertForbidden();
        $this->patchJson('/api/settings', ['name' => 'Student', 'is_admin' => true])->assertOk();
        $this->assertFalse($user->fresh()->is_admin);
        $user->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($user);
        $data = ['title' => 'New Show', 'category' => 'Events', 'about' => 'A new event', 'venue' => 'Hall', 'city' => 'Davao', 'date' => now()->addDays(2)->toDateString(), 'time' => '19:00', 'price' => 100, 'tickets' => 10];
        $this->postJson('/api/admin/events', $data)->assertOk();
        $event = $this->getJson('/web/events/new-show')->assertOk()->json();
        $this->assertSame(100, $event['tiers'][0]['price']);
        $this->deleteJson('/api/admin/events/event/'.$event['resource_id'])->assertOk();
        $this->getJson('/api/events/new-show')->assertNotFound();
    }

    public function test_favorites_are_private_and_idempotent(): void
    {
        $this->catalog();
        Sanctum::actingAs(User::factory()->create());
        $this->putJson('/api/favorites/test-show')->assertOk();
        $this->putJson('/api/favorites/test-show')->assertOk();
        $this->getJson('/api/favorites')->assertJsonCount(1);
        $this->assertDatabaseCount('favorites', 1);
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/favorites')->assertExactJson([]);
    }

    public function test_web_cinema_inventory_and_checkout_share_native_data(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['is_admin' => true])->save();
        $this->actingAs($user, 'web');
        $this->postJson('/web/admin/events', ['title' => 'New Movie', 'category' => 'Movies', 'about' => 'Film', 'venue' => 'Cinema', 'city' => 'Davao', 'date' => now()->addDays(2)->toDateString(), 'time' => '19:00', 'price' => 250, 'tickets' => 10])->assertOk();
        $id = $this->getJson('/web/movies/new-movie/screenings')->assertOk()->json('screenings.0.id');
        $seat = $this->getJson('/api/screenings/'.$id.'/seats')->assertOk()->json('seats.0.id');
        $hold = $this->postJson('/web/screenings/'.$id.'/holds', ['seat_ids' => [$seat]])->assertCreated()->json('hold_token');
        $this->fakeSession();
        $this->postJson('/web/screenings/'.$id.'/bookings', ['hold_token' => $hold, 'request_key' => (string) Str::uuid()])->assertCreated();
        $this->getJson('/api/screenings/'.$id.'/seats')->assertJsonPath('seats.0.status', 'occupied');
        $this->assertDatabaseCount('tickets', 0);
        $this->fakeSession(true, 'active', 25000);
        $this->webhook()->assertOk();
        $this->assertDatabaseCount('tickets',1);
        $this->assertDatabaseHas('ticket_seats',['seat_id' => $seat]);
    }
}
