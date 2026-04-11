<?php

/*
* =======================================================================
* FILE NAME:        Usersettings.php
* DATE CREATED:  	09-01-2019
* FOR TABLE:  		user_settings
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Usersettings extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'user_settings';

    /* get primary key name as in DB */
    protected $primaryKey = 'setting_id';

    /* fillable fields */
    protected $fillable = ['user_id', 'business_name', 'email_address', 'address_for_invoice', 'upload_logo', 'vat', 'terms', 'invoice_message', 'job_message'];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
