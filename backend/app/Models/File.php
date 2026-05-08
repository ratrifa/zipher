<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'size', 'mime_type', 'storage_path', 'aes_key_encrypted', 'user_id', 'folder_id', 'is_starred'])]
class File extends Model
{
    use HasUuids, SoftDeletes;

    protected $casts = [
        'is_starred' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class);
    }

    public function shares()
    {
        return $this->hasMany(SharedFile::class);
    }

    public function tags()
    {
        return $this->hasMany(FileTag::class)->orderBy('score', 'desc');
    }

    public function keywords()
    {
        return $this->hasMany(FileKeyword::class);
    }
}
