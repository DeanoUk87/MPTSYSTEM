<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CollectedOrders;
use Illuminate\Http\Request;

class CollectedOrdersController extends Controller
{
    /**
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Collected Orders VIAS
        if ($request->input('orders2')) {
            $orders2 = $request->input('orders2');
            $via = $request->input('viaId');
            $bookingId = $request->input('bookId');
            foreach ($orders2 as $order) {
                $order_number = isset($order['collected_orders2']) ? $order['collected_orders2'] : '';
                $ambience = isset($order['collected_ambience2']) ? $order['collected_ambience2'] : 0;
                $chill = isset($order['collected_chill2']) ? $order['collected_chill2'] : 0;
                $pump = isset($order['collected_pump2']) ? $order['collected_pump2'] : 0;
                $stores = isset($order['collected_stores2']) ? $order['collected_stores2'] : 0;
                CollectedOrders::create([
                    'booking_id' => $bookingId,
                    'type' => 'via',
                    'via' => $via,
                    'order_number' => $order_number,
                    'ambience' => $ambience,
                    'chill' => $chill,
                    'pump' => $pump,
                    'stores' => $stores,
                ]);
            }

            return back()->withInput()->with('success', 'Record Updated Successfully.');
        }
    }
}
