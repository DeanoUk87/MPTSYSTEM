<?php

/*
* =======================================================================
* FILE NAME:        Jobaccess.php
* DATE CREATED:  	13-06-2022
* FOR TABLE:  		job_access
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jobaccess extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'job_access';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['job_id', 'user_id', 'access', 'isRequest'];
}
