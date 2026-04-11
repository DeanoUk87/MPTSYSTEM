<?php

/*
* =======================================================================
* FILE NAME:        Markers.php
* DATE CREATED:  	06-04-2021
* FOR TABLE:  		markers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Markers extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'markers';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['postcode', 'lat', 'lng'];

    public function getCreatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('dS M Y H:i a');
    }

    public function getUpdatedAtAttribute($date)
    {
        return Carbon::parse($date)->format('dS M Y H:i a');
    }
}
