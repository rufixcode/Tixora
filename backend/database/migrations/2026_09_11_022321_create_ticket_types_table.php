<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->id();

            $table->foreignId('concert_id')
                ->nullable()
                ->constrained('concerts')
                ->cascadeOnDelete();

            $table->foreignId('event_id')
                ->nullable()
                ->constrained('events')
                ->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();

            $table->decimal('price', 10, 2);

            $table->unsignedInteger('quantity');
            $table->unsignedInteger('available_quantity');

            $table->timestamps();

            $table->index([
                'concert_id',
                'event_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_types');
    }
};