<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'file_id', 'file_name', 'mime_type', 'is_folder', 'action'])]
class FileActivity extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $casts = [
        'is_folder'  => 'boolean',
        'created_at' => 'datetime',
    ];
}
