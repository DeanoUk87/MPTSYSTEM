<?php

/*
* =======================================================================
* FILE NAME:        Driverscontact.php
* DATE CREATED:  	11-05-2021
* FOR TABLE:  		drivers_contact
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driverscontact extends Model
{
    use SoftDeletes;

    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'drivers_contact';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['driver_id', 'driver_name', 'vehicle_make', 'vehicle_registeration', 'driver_phone', 'dcontactId'];
}
