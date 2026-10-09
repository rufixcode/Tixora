<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    private function ticket(User $owner, string $status = 'confirmed'): array
    {
        $booking = DB::table('bookings')->insertGetId(['user_id' => $owner->id, 'booking_reference' => 'TX-'.Str::random(16), 'booking_type' => 'event', 'status' => $status, 'total_amount' => 250, 'event_title' => 'Test Show']);
        $token = Str::random(48);
        $ticket = DB::table('tickets')->insertGetId(['booking_id' => $booking, 'ticket_number' => 'TK-'.Str::random(20), 'ticket_type' => 'event', 'status' => 'valid', 'qr_code' => $token]);

        return [$ticket, 'tixora:ticket:'.$token];
    }

    public function test_ticket_codes_are_private_and_only_confirmed_valid_tickets_show_qr(): void
    {
        $owner = User::factory()->create();
        [$ticket, $code] = $this->ticket($owner);
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/bookings')->assertExactJson([]);
        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/bookings')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame($code, $response->json('0.tickets.0.qr_payload'));
        $this->assertArrayNotHasKey('qr_code', $response->json('0.tickets.0'));
        DB::table('tickets')->where('id', $ticket)->update(['status' => 'used']);
        $this->getJson('/api/bookings')->assertJsonPath('0.tickets.0.qr_payload', null);
        $this->ticket($owner, 'pending');
        $this->getJson('/api/bookings')->assertJsonPath('0.tickets.0.qr_payload', null);
    }

    public function test_only_admin_can_check_and_password_is_required_to_admit_once(): void
    {
        $owner = User::factory()->create();
        [$ticket, $code] = $this->ticket($owner);
        Sanctum::actingAs($owner);
        $this->postJson('/api/admin/tickets/check', ['code' => $code])->assertForbidden();
        $admin = User::factory()->create(['password' => 'SecureExample!Pass72']);
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin, 'web');
        $this->postJson('/web/admin/tickets/check', ['code' => $code])->assertOk()->assertJsonPath('status', 'valid')->assertJsonPath('admitted', false);
        $this->assertDatabaseHas('tickets', ['id' => $ticket, 'status' => 'valid']);
        $this->postJson('/web/admin/tickets/check', ['code' => $code, 'admit' => true, 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/web/admin/tickets/check', ['code' => $code, 'admit' => true])->assertUnprocessable();
        $this->postJson('/web/admin/tickets/check', ['code' => $code, 'admit' => true, 'password' => 'SecureExample!Pass72'])->assertOk()->assertJsonPath('admitted', true);
        $this->postJson('/web/admin/tickets/check', ['code' => $code, 'admit' => true, 'password' => 'SecureExample!Pass72'])->assertConflict();
        $this->assertDatabaseCount('ticket_verifications', 1);
        $this->assertDatabaseHas('ticket_verifications', ['ticket_id' => $ticket, 'verified_by' => $admin->id, 'result' => 'admitted']);
    }

    public function test_tampered_codes_and_unconfirmed_bookings_cannot_be_admitted(): void
    {
        $admin = User::factory()->create(['password' => 'SecureExample!Pass72']);
        $admin->forceFill(['is_admin' => true])->save();
        Sanctum::actingAs($admin);
        [, $code] = $this->ticket($admin, 'pending');
        $this->postJson('/api/admin/tickets/check', ['code' => $code])->assertUnprocessable();
        $this->postJson('/api/admin/tickets/check', ['code' => 'tixora:ticket:'.str_repeat('x', 48)])->assertNotFound();
        $this->postJson('/api/admin/tickets/check', ['code' => 'TK-123'])->assertUnprocessable();
        $this->assertDatabaseCount('ticket_verifications', 0);
    }
}
