<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'user_id', 'parent_id', 'is_starred'])]
class Folder extends Model
{
    use HasUuids, SoftDeletes;

    protected $casts = ['is_starred' => 'boolean'];

    protected $appends = ['items_count', 'total_size'];

    public function getItemsCountAttribute(): int
    {
        $fileCount = $this->files()->withTrashed()->count();
        $folderCount = $this->children()->withTrashed()->count();
        return $fileCount + $folderCount;
    }

    public function getTotalSizeAttribute(): int
    {
        $fileSize = (int) $this->files()->withTrashed()->sum('size');
        $childrenSize = 0;
        foreach ($this->children()->withTrashed()->get() as $child) {
            $childrenSize += $child->total_size;
        }
        return $fileSize + $childrenSize;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    public function files()
    {
        return $this->hasMany(File::class);
    }
}
