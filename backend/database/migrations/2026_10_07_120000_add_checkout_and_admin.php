<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('is_admin')->default(false));
        Schema::table('bookings', function (Blueprint $t) {
            $t->uuid('request_key')->nullable();
            $t->string('event_title')->nullable();
            $t->string('payment_session_id')->nullable()->unique();
            $t->text('checkout_url')->nullable();
            $t->unique(['user_id', 'request_key']);
        });
        Schema::create('booking_seats', function (Blueprint $t) {
            $t->id();
            $t->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $t->foreignId('screening_id')->constrained()->cascadeOnDelete();
            $t->foreignId('seat_id')->constrained()->cascadeOnDelete();
            $t->unique(['screening_id', 'seat_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_seats');
        Schema::table('bookings', function (Blueprint $t) {
            $t->dropUnique(['user_id', 'request_key']);
            $t->dropUnique(['payment_session_id']);
            $t->dropColumn(['request_key', 'event_title', 'payment_session_id', 'checkout_url']);
        });
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_admin'));
    }
};
