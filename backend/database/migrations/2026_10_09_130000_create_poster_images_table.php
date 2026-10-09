<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poster_images', function (Blueprint $table) {
            $table->string('filename', 64)->primary();
            $table->string('mime_type', 32);
            $table->longText('content');
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poster_images');
    }
};
