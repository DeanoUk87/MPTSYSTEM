<?php

/*
* =======================================================================
* FILE NAME:        Customervehiclerates.php
* DATE CREATED:  	09-01-2019
* FOR TABLE:  		customer_vehicle_rates
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customervehiclerates extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'customer_vehicle_rates';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['vehicle_id', 'rate_per_mile', 'customer_id', 'rate_per_mile_weekends', 'rate_per_mile_out_of_hours'];
}
