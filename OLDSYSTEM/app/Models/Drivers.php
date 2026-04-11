<?php

/*
* =======================================================================
* FILE NAME:        Drivers.php
* DATE CREATED:  	09-01-2019
* FOR TABLE:  		drivers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Drivers extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'drivers';

    /* get primary key name as in DB */
    protected $primaryKey = 'driver_id';

    /* fillable fields */
    protected $fillable = [
        'driver', 'driver_email', 'driver_phone', 'driver_address', 'driver_others',
        'user_id', 'driver_type', 'cost_per_mile', 'cost_per_mile_weekends', 'cost_per_mile_out_of_hours',
    ];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
