<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fuelsurcharges extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'fuel_surcharges';

    /* get primary key name as in DB */
    protected $primaryKey = 'id';

    /* fillable fields */
    protected $fillable = ['price', 'percentage'];

    protected function getPriceAttribute($price)
    {
        return number_format($price);
    }
}
