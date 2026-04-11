<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollectedOrders extends Model
{
    /* disable Eloquent timestamps */
    public $timestamps = true;

    /* database table name */
    protected $table = 'collected_orders';

    protected $fillable = [
        'booking_id', 'type', 'order_number', 'ambience', 'chill', 'pump', 'stores', 'via',
    ];
}
