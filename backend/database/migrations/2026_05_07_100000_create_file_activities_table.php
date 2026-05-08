<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('file_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->uuid('file_id')->nullable();
            $table->foreign('file_id')->references('id')->on('files')->onDelete('set null');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->boolean('is_folder')->default(false);
            $table->string('action'); // opened|downloaded|moved|shared|trashed|deleted|uploaded|created
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_activities');
    }
};
