<?php

/*
* =======================================================================
* FILE NAME:        Customers.php
* DATE CREATED:  	09-01-2019
* FOR TABLE:  		customers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customers extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'customers';

    /* get primary key name as in DB */
    protected $primaryKey = 'customer_id';

    /* fillable fields */
    protected $fillable = [
        'user_id', 'customer', 'email', 'phone', 'address', 'address2', 'address3', 'city', 'postcode', 'notes',
        'account_number', 'po_number', 'po_email', 'contact', 'dead_mileage',
    ];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
