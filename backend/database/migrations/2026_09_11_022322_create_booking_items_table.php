<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->cascadeOnDelete();

            $table->foreignId('screening_id')
                ->nullable()
                ->constrained('screenings')
                ->nullOnDelete();

            $table->foreignId('concert_id')
                ->nullable()
                ->constrained('concerts')
                ->nullOnDelete();

            $table->foreignId('event_id')
                ->nullable()
                ->constrained('events')
                ->nullOnDelete();

            $table->foreignId('ticket_type_id')
                ->nullable()
                ->constrained('ticket_types')
                ->nullOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 10, 2);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_items');
    }
};