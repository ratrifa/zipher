<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['file_id', 'owner_id', 'receiver_id', 'aes_key_encrypted_for_receiver'])]
class SharedFile extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $casts = ['shared_at' => 'datetime'];

    public function file()
    {
        return $this->belongsTo(File::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'share_id');
    }
}
