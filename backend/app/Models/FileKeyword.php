<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileKeyword extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['file_id', 'keyword'];

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }
}
