<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'id',
        'share_id',
        'file_id',
        'reporter_id',
        'reason',
    ];

    public function share()
    {
        return $this->belongsTo(SharedFile::class, 'share_id');
    }

    public function file()
    {
        return $this->belongsTo(File::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
