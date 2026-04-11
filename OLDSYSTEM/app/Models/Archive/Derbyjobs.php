<?php

/*
* =======================================================================
* FILE NAME:        Derbyjobs.php
* DATE CREATED:  	23-04-2020
* FOR TABLE:  		derby_jobs
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Models\Archive;

use Illuminate\Database\Eloquent\Model;

class Derbyjobs extends Model
{
    /* Database connection */
    protected $connection = 'mysql2';

    /* disable Eloquent timestamps */
    public $timestamps = false;

    /* database table name */
    protected $table = 'derby_jobs';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['customerid', 'ref', 'collidcity', 'colltime', 'colldatesql', 'collnametel', 'items', 'wgt', 'status', 'stype', 'attributes', 'wr', 'trafficnotes', 'deliverynotes', 'specialnotes', 'delidcity', 'deltime', 'deldatesql', 'delnametel', 'bookedby', 'porder', 'pod', 'costs', 'accounts', 'paperwork', 'via1', 'via2', 'overide', 'jobemail', 'paid', 'invoiced', 'income', 'invno', 'bl', 'grpid'];

    /*//custom timestamps name
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    */
}
