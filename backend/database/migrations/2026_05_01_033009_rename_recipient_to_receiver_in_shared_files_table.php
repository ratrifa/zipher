<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shared_files', function (Blueprint $table) {
            $table->renameColumn('recipient_id', 'receiver_id');
            $table->renameColumn('aes_key_encrypted_for_recipient', 'aes_key_encrypted_for_receiver');
        });
    }

    public function down(): void
    {
        Schema::table('shared_files', function (Blueprint $table) {
            $table->renameColumn('receiver_id', 'recipient_id');
            $table->renameColumn('aes_key_encrypted_for_receiver', 'aes_key_encrypted_for_recipient');
        });
    }
};
