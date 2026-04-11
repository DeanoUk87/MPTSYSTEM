<?php

/*
* =======================================================================
* FILE NAME:        Vehicles.php
* DATE CREATED:  	09-01-2019
* FOR TABLE:  		vehicles
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicles extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'vehicles';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['name', 'cost_per_mile', 'user_id', 'driver_id'];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
