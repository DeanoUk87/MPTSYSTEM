<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Storages extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'storages';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['unit_number', 'unit_size', 'availability', 'unit_type', 'current_driver', 'calibration_date', 'job_id', 'trackable'];

    public function getCreatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('M, d Y');
    }

    public function getUpdatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('M, d Y H:ia');
    }

    public function storageUsage()
    {
        return $this->hasMany(Storageusage::class, 'unit_id', 'id');
    }
}
