<?php

/*
* =======================================================================
* FILE NAME:        Geotrackingdetails.php
* DATE CREATED:  	19-08-2021
* FOR TABLE:  		geo_tracking_details
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Geotrackingdetails extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'geo_tracking_details';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['geo_id', 'latitude', 'longitude', 'address', 'speed'];
}
