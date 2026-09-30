<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();

            $table->string('ticket_number')->unique();

            $table->string('ticket_type');

            $table->string('status')->default('valid');

            $table->string('qr_code')->unique();

            $table->timestamp('issued_at')->nullable();
            $table->timestamp('used_at')->nullable();

            $table->timestamps();

            $table->index([
                'booking_id',
                'status'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};