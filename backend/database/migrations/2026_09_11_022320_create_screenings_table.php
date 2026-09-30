<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screenings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('movie_id')
                ->constrained('movies')
                ->cascadeOnDelete();

            $table->foreignId('screen_id')
                ->constrained('screens')
                ->cascadeOnDelete();

            $table->dateTime('start_time');
            $table->dateTime('end_time');

            $table->decimal('ticket_price', 10, 2);

            $table->string('status')->default('scheduled');

            $table->timestamps();

            $table->index([
                'movie_id',
                'start_time'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screenings');
    }
};