<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Geotracking extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'geo_tracking';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['user_id', 'driver_id', 'job_id', 'current_lat', 'current_lng', 'current_date', 'status', 'speed', 'started_lat', 'started_lng', 'ended_lat', 'ended_lng', 'started_at', 'ended_at', 'created_at', 'updated_at'];
}
