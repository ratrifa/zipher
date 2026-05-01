<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', fn(Blueprint $table) => $table->softDeletes());
        Schema::table('folders', fn(Blueprint $table) => $table->softDeletes());
    }

    public function down(): void
    {
        Schema::table('files', fn(Blueprint $table) => $table->dropSoftDeletes());
        Schema::table('folders', fn(Blueprint $table) => $table->dropSoftDeletes());
    }
};
