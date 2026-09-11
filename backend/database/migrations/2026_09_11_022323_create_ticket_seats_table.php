<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_seats', function (Blueprint $table) {
            $table->id();

            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->cascadeOnDelete();

            $table->foreignId('screening_id')
                ->constrained('screenings')
                ->cascadeOnDelete();

            $table->foreignId('seat_id')
                ->constrained('seats')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique([
                'screening_id',
                'seat_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_seats');
    }
};