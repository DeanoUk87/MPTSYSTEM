<?php

namespace App\Services\Booking;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BookingMileageService
{
    /**
     * Call Google Distance Matrix API and store results in session.
     * Returns true on success, false on failure.
     */
    public function calculateAndStore(Request $request): bool
    {
        $origin      = $this->buildAddressString($request, 'collection');
        $destination = $this->buildAddressString($request, 'delivery');

        $params = [
            'units'        => 'imperial',
            'origins'      => $origin,
            'destinations' => $destination,
            'key'          => config('services.google.api_key'),
        ];

        if ($request->input('avoid_tolls')) {
            $params['avoid'] = 'tolls';
        }

        $response = Http::get('https://maps.googleapis.com/maps/api/distancematrix/json', $params);
        $data     = $response->json();

        if (($data['rows'][0]['elements'][0]['status'] ?? '') !== 'OK') {
            return false;
        }

        $mileRaw = str_replace(['mi', ' ', ','], '', $data['rows'][0]['elements'][0]['distance']['text']);

        if (! is_numeric($mileRaw)) {
            return false;
        }

        $mile        = (float) $mileRaw;
        $time        = $data['rows'][0]['elements'][0]['duration']['text'];
        $cost        = $mile * ((int) $request->input('perMile') / 100);
        $vehicleCost = explode('|', $request->input('vehicleCost'));

        $request->session()->put('perMile', $request->input('perMile'));
        $request->session()->put('miles', $mile);
        $request->session()->put('time', $time);
        $request->session()->put('cost', $cost);
        $request->session()->put('from', $origin);
        $request->session()->put('to', $destination);
        $request->session()->put('vehicleInfo', $request->input('vehicleInfo'));
        $request->session()->put('vehicle', $request->input('vehicle'));
        $request->session()->put('vehicleCost', [
            'rate' => $vehicleCost[0],
            'id'   => $vehicleCost[1],
            'name' => $vehicleCost[2],
        ]);

        // Flash address fields back to form
        foreach (['collection', 'delivery'] as $type) {
            foreach (['name', 'address1', 'address2', 'area', 'country', 'postcode', 'phone', 'contact'] as $field) {
                $request->session()->flash("{$type}_{$field}", $request->input("{$type}_{$field}"));
            }
        }

        return true;
    }

    public function clearSession(Request $request): void
    {
        $request->session()->forget(['perMile', 'miles', 'time', 'cost', 'from', 'to', 'vehicleInfo', 'vehicle']);
    }

    private function buildAddressString(Request $request, string $type): string
    {
        $parts = [
            $request->input("{$type}_address1") . ',',
            $request->input("{$type}_address2") ? $request->input("{$type}_address2") . ',' : '',
            $request->input("{$type}_area")     ? $request->input("{$type}_area")     . ',' : '',
            $request->input("{$type}_postcode") ? $request->input("{$type}_postcode") . ',' : '',
            $request->input("{$type}_country")  ? $request->input("{$type}_country")  . ',' : '',
        ];

        return trim(str_replace(' ', '+', implode('', $parts)));
    }
}