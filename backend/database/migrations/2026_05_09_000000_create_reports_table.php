<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('share_id')->constrained('shared_files')->cascadeOnDelete();
            $table->foreignUuid('file_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('reason');
            $table->timestamp('created_at')->useCurrent();
            $table->index('share_id');
            $table->index('reporter_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
