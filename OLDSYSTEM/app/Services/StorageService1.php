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
            return $response->json();
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
            $ignitionValue = $sensor['ignition'];

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
                        $notificationMessage[] = "Temperature out of range for {$storageNumber[0]}, Type: {$unitType}, IMEI: {$sensor['imei']}, Ignition: {$ignitionValue},  Temperature: {$computedValue}°C";
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
