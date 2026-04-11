<?php

/**
 * Created by Hezecom TS LTD.
 * User: hezecom
 * Date: 25/01/2022
 * Time: 6:46 PM
 */

namespace App\Helper;

use App\Models\CollectedOrders;

class AppHelper
{
    /**
     * @param  string  $type
     * @return array
     *               Get Collected Orders for Final Delivery
     */
    public static function orderMain($bookId, $type = 'main')
    {
        $order = CollectedOrders::where('booking_id', $bookId)
            ->where('type', $type)
            ->orderBy('id');
        if ($order->count() > 0) {
            return $order->get();
        } else {
            return [];
        }

    }

    /**
     * @return array
     *               Get Collected Orders for Vias
     */
    public static function orderVia($bookId, $type, $viaNum)
    {
        $order = CollectedOrders::where('booking_id', $bookId)
            ->where('type', $type)
            ->where('via', $viaNum)
            ->orderBy('id');

        if ($order->count() > 0) {
            return $order->get();
        } else {
            return [];
        }

    }
}
