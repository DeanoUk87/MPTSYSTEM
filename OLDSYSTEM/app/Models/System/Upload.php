<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Upload extends Model
{
    protected $table = 'hts_uploads';

    public $timestamps = false;

    protected $fillable = [
        'fileId',
        'relatedId',
        'filename',
        'tablekey',
    ];

    protected $appends = ['image_url'];

    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->filename
                ? Storage::disk('public')->url('uploads/'.$this->filename)
                : null
        );
    }
}
