<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_require_authentication(): void
    {
        $this->patchJson('/web/settings', ['name' => 'Someone'])->assertUnauthorized();
        $this->deleteJson('/api/account')->assertUnauthorized();
    }

    public function test_profile_and_preferences_persist_without_changing_other_accounts(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create(['username' => 'taken']);
        $this->actingAs($user, 'web')->patchJson('/web/settings', [
            'name' => ' New Name ', 'username' => 'MY_NAME',
            'preferences' => ['favorite_category' => 'Movies'], 'email' => 'changed@example.com',
        ])->assertOk()->assertJsonPath('user.username', 'my_name')->assertJsonMissingPath('user.password');
        $this->assertSame('New Name', $user->fresh()->name);
        $this->assertSame('Movies', $user->fresh()->preferences['favorite_category']);
        $this->assertSame($user->email, $user->fresh()->email);
        $this->patchJson('/web/settings', ['username' => 'TAKEN'])->assertUnprocessable();
        $this->patchJson('/web/settings', ['username' => 'bad name'])->assertUnprocessable();
        $this->patchJson('/web/settings', ['preferences' => ['favorite_category' => 'Invalid']])->assertUnprocessable();
        $this->assertSame('taken', $other->fresh()->username);
    }

    public function test_deletion_requires_password_and_confirmation_and_revokes_access(): void
    {
        $user = User::factory()->create(['password' => 'long-password-123']);
        $other = User::factory()->create();
        $user->createToken('test');
        DB::table('sessions')->insert(['id' => 'account-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        DB::table('bookings')->insert(['user_id' => $user->id, 'booking_reference' => 'TEST', 'booking_type' => 'movie']);
        $this->actingAs($user, 'web')->deleteJson('/web/account', ['password' => 'wrong', 'confirmation' => 'DELETE'])->assertUnprocessable();
        $this->deleteJson('/web/account', ['password' => 'long-password-123', 'confirmation' => 'no'])->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->deleteJson('/web/account', ['password' => 'long-password-123', 'confirmation' => 'DELETE'])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $other->id]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('bookings', ['user_id' => $user->id]);
        $this->getJson('/web/me')->assertUnauthorized();
    }

    public function test_token_authenticated_settings_and_deletion(): void
    {
        $user = User::factory()->create(['password' => 'long-password-123']);
        $token = $user->createToken('mobile')->plainTextToken;
        $this->withToken($token)->patchJson('/api/settings', ['username' => 'mobile_user'])->assertOk();
        $this->withToken($token)->deleteJson('/api/account', ['password' => 'long-password-123', 'confirmation' => 'DELETE'])->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
