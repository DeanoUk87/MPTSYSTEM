<?php

namespace App\Services\Booking;

use App\Models\CollectedOrders;
use Illuminate\Http\Request;

class BookingCollectedOrdersService
{
    /**
     * Sync main and via collected orders from the request.
     */
    public function sync(Request $request, int $jobRef): void
    {
        $this->syncMain($request, $jobRef);
        $this->syncVias($request, $jobRef);
    }

    private function syncMain(Request $request, int $jobRef): void
    {
        if (! $request->input('orders')) {
            return;
        }

        foreach ($request->input('orders') as $order) {
            $orderNumber = $order['collected_orders'] ?? '';
            if (! $orderNumber) {
                continue;
            }

            CollectedOrders::updateOrCreate(
                ['id' => $order['orderId'] ?? 0],
                [
                    'booking_id'   => $jobRef,
                    'type'         => 'main',
                    'order_number' => $orderNumber,
                    'ambience'     => $order['collected_ambience'] ?? 0,
                    'chill'        => $order['collected_chill'] ?? 0,
                ]
            );
        }
    }

    private function syncVias(Request $request, int $jobRef): void
    {
        for ($num = 1; $num <= 6; $num++) {
            if (! $request->input('orders' . $num)) {
                continue;
            }

            foreach ($request->input('orders' . $num) as $order) {
                $orderNumber = $order['collected_orders' . $num] ?? '';
                if (! $orderNumber) {
                    continue;
                }

                $viaId   = $order['viaId'] ?? 0;
                $orderId = $order['orderId'] ?? 0;

                CollectedOrders::updateOrCreate(
                    ['id' => $orderId, 'type' => 'via', 'via' => $viaId],
                    [
                        'booking_id'   => $jobRef,
                        'type'         => 'via',
                        'via'          => $viaId,
                        'order_number' => $orderNumber,
                        'ambience'     => $order['collected_ambience' . $num] ?? 0,
                        'chill'        => $order['collected_chill' . $num] ?? 0,
                    ]
                );
            }
        }
    }
}