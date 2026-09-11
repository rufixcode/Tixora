<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();

            $table->foreignId('screen_id')
                ->constrained('screens')
                ->cascadeOnDelete();

            $table->string('row_label');
            $table->unsignedInteger('seat_number');
            $table->string('seat_type')->default('regular');

            $table->timestamps();

            $table->unique([
                'screen_id',
                'row_label',
                'seat_number'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};