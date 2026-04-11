<?php

/*
* =======================================================================
* FILE NAME:        Invoices.php
* DATE CREATED:  	11-01-2019
* FOR TABLE:  		invoices
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoices extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'invoices';

    /* get primary key name as in DB */
    protected $primaryKey = 'invoice_number';

    /* fillable fields */
    protected $fillable = ['title', 'notes', 'updated_at', 'created_at', 'user_id', 'customer_id'];
}
