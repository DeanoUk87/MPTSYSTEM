<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Storageusage extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'storage_usage';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['unit_id', 'job_id', 'driver_id'];
}
