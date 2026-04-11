<?php

/*
* =======================================================================
* FILE NAME:        Derbyattributes.php
* DATE CREATED:  	23-04-2020
* FOR TABLE:  		derby_attributes
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models\Archive;

use Illuminate\Database\Eloquent\Model;

class Derbyattributes extends Model
{
    /* Database connection */
    protected $connection = 'mysql2';

    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'derby_attributes';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['name', 'type', 'sptxt', 'spno', 'axs'];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
