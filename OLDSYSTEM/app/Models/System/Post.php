<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    // disable Eloquent timestamps
    // public $timestamps = false;

    // database table name
    protected $table = 'hts_posts';

    // fillable fields
    protected $fillable = ['title', 'content', 'picture'];

    // custom timestamps name
    const CREATED_AT = 'created';

    const UPDATED_AT = 'modified';
}
