<?php

/*
* =======================================================================
* FILE NAME:        Systemactivities.php
* DATE CREATED:  	04-01-2019
* FOR TABLE:  		system_activities
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Systemactivities extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'system_activities';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['user_id', 'subject', 'url', 'method', 'ip', 'agent', 'created_at', 'updated_at', 'job_ref'];

    public function getCreatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('d-M-Y H:i a');
    }
}
