<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('file_keywords', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('(UUID())'));
            $table->foreignUuid('file_id')->constrained()->cascadeOnDelete();
            $table->string('keyword');
            $table->index('file_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_keywords');
    }
};
