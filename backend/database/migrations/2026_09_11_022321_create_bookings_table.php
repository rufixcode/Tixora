<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('booking_reference')->unique();

            $table->string('booking_type');

            $table->string('status')->default('pending');

            $table->decimal('total_amount', 10, 2)->default(0);

            $table->timestamp('booked_at')->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'status'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};