<?php

/*
* =======================================================================
* FILE NAME:        Derbycustomer.php
* DATE CREATED:  	23-04-2020
* FOR TABLE:  		derby_customer
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models\Archive;

use Illuminate\Database\Eloquent\Model;

class Derbycustomer extends Model
{
    /* Database connection */
    protected $connection = 'mysql2';

    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'derby_customer';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['name', 'addy1', 'addy2', 'addy3', 'city', 'county', 'pcode', 'phone', 'eemail', 'contact', 'accno', 'cnotes', 'spare', 'podemail', 'vehicles'];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
