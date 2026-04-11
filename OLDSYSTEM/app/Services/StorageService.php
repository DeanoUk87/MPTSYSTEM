<?php

namespace App\Services;

use App\Models\Storages;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class StorageService
{
    /**
     * @return array|mixed
     *
     * @throws ConnectionException|FileNotFoundException
     */
    public function getLiveData(): mixed
    {
        if (config('services.gpslive.use_mock')) {
            $path = database_path('mock/sensor.json');
            if (File::exists($path)) {
                return json_decode(File::get($path), true);
            }

            return [];
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.config('services.gpslive.key'),
        ])->get('https://api.gpslive.app/v1/devices/sensor-values');

        if ($response->successful()) {
            $json = $response->json();
            // API may return plain array or wrapped in a 'data' key
            if (isset($json['data']) && is_array($json['data'])) {
                return $json['data'];
            }
            return is_array($json) ? $json : [];
        }

        return [];
    }

    /**
     * @throws ConnectionException|FileNotFoundException
     */
    public function getSensorData(): array
    {
        $notificationMessage = [];
        $ignitionValue = [];
        $temperatureValue = [];
        $devices = $this->getLiveData();
        if ($devices) {
            foreach ($devices as $device) {
                $imei = $device['imei'];
                $unit = $device['name'];

                foreach ($device['sensors'] as $sensor) {
                    if (stripos($sensor['name'], 'Ignition') !== false) {
                        $ignitionValue[] = ['imei' => $imei, 'name' => $unit, 'ignition' => $sensor['data']['computed_value_with_unit']];
                    }
                    if (stripos($sensor['name'], 'Temperature') !== false) {
                        $temperatureValue[] = ['imei' => $imei, 'name' => $unit, 'temperature' => $sensor['data']['computed_value']];
                    }
                }
            }
        }
        /* Merge ignition data with temperature data On or Off */
        $ignitionCollection = collect($ignitionValue);
        $temperatureCollection = collect($temperatureValue);

        $mergedDataOnOff = $ignitionCollection->map(function ($ignitionItem) use ($temperatureCollection) {
            $temperatureItem = $temperatureCollection->firstWhere('imei', $ignitionItem['imei']);

            return array_merge($ignitionItem, [
                'temperature' => $temperatureItem['temperature'] ?? 0,
            ]);
        });
        // Sort by ignition status, with "On" first
        $mergedDataArrayOnOff = $mergedDataOnOff->sortByDesc(function ($item) {
            return $item['ignition'] === 'On';
        })->values()->all();

        // Filter ignitionValue where ignition is "On" only
        $filteredIgnition = collect($ignitionValue)->filter(function ($item) {
            return $item['ignition'] === 'On';
        });
        // Merge the filtered ignition with temperature data based on IMEI
        $mergedDataOn = $filteredIgnition->map(function ($ignitionItem) use ($temperatureValue) {
            $temperatureItem = collect($temperatureValue)->firstWhere('imei', $ignitionItem['imei']);

            return array_merge($ignitionItem, [
                'temperature' => $temperatureItem['temperature'] ?? null,
            ]);
        });
        $mergedDataArrayOn = $mergedDataOn->all();

        foreach ($mergedDataArrayOn as $sensor) {
            $computedValue = $sensor['temperature'];
            $ignitionStatus = $sensor['ignition'];

            if (Storages::where('imei', $sensor['imei'])->where('trackable', 1)->count() > 0) {
                $storage = Storages::where('imei', $sensor['imei'])->where('trackable', 1)->first();
                $storageNumber = explode(' ', $storage->unit_number);

                if ($storage) {
                    $unitType = $storage->unit_type;
                    $outsideRange = false;

                    if (($unitType == 'Chill' && ($computedValue < 2 || $computedValue > 8)) ||
                        ($unitType == 'Ambient' && ($computedValue < 15 || $computedValue > 25))) {
                        $outsideRange = true;
                    }

                    if ($outsideRange) {
                        $notificationMessage[] = "Temperature out of range for {$storageNumber[0]}, Type: {$unitType}, IMEI: {$sensor['imei']}, Ignition: {$ignitionStatus}, Temperature: {$computedValue}°C";
                    }
                }
            }
        }

        return [
            // 'data'=>$devices,
            'messages' => $notificationMessage,
            'messageCount' => count($notificationMessage),
            'mergedData' => $mergedDataArrayOnOff,
            'mergedDataArrayCount' => count($mergedDataArrayOnOff),
        ];
    }

    /**
     * Get last-known positions for all devices, keyed by IMEI.
     * Tries /v1/devices first (full device list with current position),
     * then falls back to /v1/devices/last-positions.
     */
    public function getPositions(): array
    {
        if (config('services.gpslive.use_mock')) {
            // Re-use the sensor mock — lat/lng are included at device root level
            $path = database_path('mock/sensor.json');
            if (File::exists($path)) {
                $raw = json_decode(File::get($path), true) ?? [];
                $map = [];
                foreach ($raw as $device) {
                    $imei = $device['imei'] ?? null;
                    if ($imei && (isset($device['lat']) || isset($device['latitude']))) {
                        $map[$imei] = $device;
                    }
                }
                return $map;
            }
            return [];
        }

        // Try /v1/devices (includes current position in most GPS APIs)
        $endpoints = [
            'https://api.gpslive.app/v1/devices',
            'https://api.gpslive.app/v1/devices/last-positions',
        ];

        foreach ($endpoints as $url) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.config('services.gpslive.key'),
            ])->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $map  = [];
                foreach ($data as $device) {
                    $imei = $device['imei'] ?? null;
                    $lat  = $device['lat']  ?? ($device['latitude']  ?? null);
                    $lng  = $device['lng']  ?? ($device['longitude'] ?? null);
                    if ($imei && $lat && $lng) {
                        $map[$imei] = $device;
                    }
                }
                if (! empty($map)) {
                    return $map;
                }
            }
        }

        return [];
    }

    /**
     * Get location + temperature for specific units by IMEI.
     * Uses GET /v1/devices — location is at objectData.data.latitude/longitude
     * Temperature is at objectData.data.params.temp1 (integer × 10, e.g. 206 = 20.6°C)
     */
    public function getUnitLocations(array $imeis): array
    {
        if (empty($imeis)) return [];

        if (config('services.gpslive.use_mock')) {
            // Mock: read lat/lng from sensor.json where we added them
            $sensorRaw = $this->getLiveData();
            $results   = [];
            foreach ($sensorRaw as $device) {
                $imei = (string)($device['imei'] ?? '');
                if (! in_array($imei, array_map('strval', $imeis))) continue;
                $lat = isset($device['lat']) ? (float)$device['lat'] : null;
                $lng = isset($device['lng']) ? (float)$device['lng'] : null;
                if ($lat === null || $lng === null) continue;
                $temp = null;
                foreach ($device['sensors'] ?? [] as $sensor) {
                    if (stripos($sensor['name'], 'Temperature') !== false) {
                        $raw  = $sensor['data']['computed_value'] ?? null;
                        $temp = $raw !== null ? round((float)$raw / 10, 1) : null;
                        break;
                    }
                }
                $results[] = [
                    'imei'        => $imei,
                    'lat'         => $lat,
                    'lng'         => $lng,
                    'temperature' => $temp,
                    'updated'     => $device['updated_at'] ?? null,
                ];
            }
            return $results;
        }

        // Live API: GET /v1/devices contains objectData.data with lat/lng and params.temp1
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.config('services.gpslive.key'),
        ])->get('https://api.gpslive.app/v1/devices');

        if (! $response->successful()) {
            return [];
        }

        $devices = $response->json();
        $results = [];

        foreach ($devices as $device) {
            $imei = (string)($device['imei'] ?? '');
            if (! in_array($imei, array_map('strval', $imeis))) continue;

            $data = $device['objectData']['data'] ?? null;
            if (! $data) continue;

            $lat = isset($data['latitude'])  ? (float)$data['latitude']  : null;
            $lng = isset($data['longitude']) ? (float)$data['longitude'] : null;

            if ($lat === null || $lng === null) continue;

            // temp1 is stored as integer × 10 (e.g. 206 = 20.6°C, 109 = 10.9°C)
            $rawTemp = $data['params']['temp1'] ?? null;
            $temp    = $rawTemp !== null ? round((float)$rawTemp / 10, 1) : null;

            $results[] = [
                'imei'        => $imei,
                'lat'         => $lat,
                'lng'         => $lng,
                'temperature' => $temp,
                'address'     => $data['address'] ?? null,
                'speed'       => $data['speed']   ?? null,
                'updated'     => $data['dtTracker'] ?? null,
            ];
        }

        return $results;
    }

    public function sendEmailNotification(): void
    {
        $data = $this->getSensorData();
        $notificationMessage = $data['messages'];

        // send email
        if (count($notificationMessage)) {
            $noticeMsg = '';
            foreach ($notificationMessage as $message) {
                $noticeMsg .= $message."\n";
            }
            Mail::raw($noticeMsg, function ($message) {
                $message->to(config('mail.notification.email'))
                    ->subject('Temperature Alert');
            });
        }
    }
}
