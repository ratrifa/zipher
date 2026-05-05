<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['file_id', 'name', 'score'])]
class FileTag extends Model
{
    use HasUuids;

    public function file()
    {
        return $this->belongsTo(File::class);
    }
}
