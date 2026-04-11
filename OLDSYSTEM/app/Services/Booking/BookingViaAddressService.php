<?php

namespace App\Services\Booking;

use App\Models\Viaaddress;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingViaAddressService
{
    /**
     * Save the main collection/delivery addresses to the address book (firstOrCreate).
     */
    public function saveAddressBook(Request $request, int $userId): void
    {
        $this->saveToAddressBook($request, 'collection', $userId);
        $this->saveToAddressBook($request, 'delivery', $userId);
    }

    /**
     * Create via addresses from numbered request inputs (address1-1 … address1-6).
     */
    public function createVias(Request $request, int $jobRef, int $userId): void
    {
        for ($num = 1; $num <= 6; $num++) {
            $address1 = $request->input('address1-' . $num);
            if (! $address1) {
                continue;
            }
            foreach ($address1 as $key => $value) {
                if ($value) {
                    Viaaddress::create($this->buildViaData($request, $num, $key, $jobRef, $userId));
                }
            }
        }
    }

    /**
     * Update or create via addresses (used during booking edit).
     */
    public function updateVias(Request $request, int $jobRef, int $userId): void
    {
        for ($num = 1; $num <= 6; $num++) {
            $address1 = $request->input('address1-' . $num);
            if (! $address1) {
                continue;
            }
            foreach ($address1 as $key => $value) {
                if (! $value) {
                    continue;
                }
                $viaId = $request->input('id-' . $num);
                if ($viaId && Viaaddress::where('via_id', $viaId)->exists()) {
                    Viaaddress::where('via_id', $viaId)
                        ->update($this->buildViaUpdateData($request, $num, $key, $jobRef));
                } else {
                    $name = $request->input('name-' . $num)[$key];
                    Viaaddress::create($this->buildViaData($request, $num, $key, $jobRef, $userId));
                    // Remove any soft-deleted duplicates
                    Viaaddress::where('job_ref', $jobRef)
                        ->where('name', $name)
                        ->whereNotNull('deleted_at')
                        ->delete();
                }
            }
        }
    }

    /**
     * Update only POD-related fields on via addresses (used in updatePOD).
     */
    public function updateViaPOD(Request $request): void
    {
        for ($num = 1; $num <= 6; $num++) {
            $signedBy = $request->input('signed_by-' . $num);
            if (! $signedBy) {
                continue;
            }
            foreach ($signedBy as $key => $value) {
                if ($value) {
                    Viaaddress::where('via_id', $request->input('id-' . $num))
                        ->update([
                            'via_pod_data_verify'   => $request->input('pod_verify-' . $num)[$key],
                            'signed_by'             => $value,
                            'date'                  => $this->dateYMD($request->input('pod_date-' . $num)[$key]),
                            'time'                  => $request->input('pod_time-' . $num)[$key],
                            'delivered_temperature' => $request->input('delivered_temperature-' . $num)[$key],
                        ]);
                }
            }
        }
    }

    /**
     * Update via addresses when only recalculating mileage (Get Mileage button).
     */
    public function updateViasForMileage(Request $request, int $jobRef): void
    {
        for ($num = 1; $num <= 6; $num++) {
            $address1 = $request->input('address1-' . $num);
            if (! $address1) {
                continue;
            }
            foreach ($address1 as $key => $value) {
                if (! $value) {
                    continue;
                }
                $viaId = $request->input('id-' . $num);
                if ($viaId && Viaaddress::where('via_id', $viaId)->exists()) {
                    Viaaddress::where('via_id', $viaId)->update([
                        'via_type' => $request->input('via_type-' . $num)[$key],
                        'job_ref'  => $jobRef,
                        'name'     => $request->input('name-' . $num)[$key],
                        'address1' => $value,
                        'address2' => $request->input('address2-' . $num)[$key],
                        'area'     => $request->input('area-' . $num)[$key],
                        'country'  => $request->input('country-' . $num)[$key],
                        'postcode' => $request->input('postcode-' . $num)[$key],
                        'phone'    => $request->input('phone-' . $num)[$key],
                        'contact'  => $request->input('contact-' . $num)[$key],
                        'notes'    => $request->input('notes-' . $num)[$key],
                        'via_date' => $this->dateYMD($request->input('via_date-' . $num)[$key]),
                        'via_time' => $request->input('via_time-' . $num)[$key],
                    ]);
                } else {
                    Viaaddress::create([
                        'via_type' => $request->input('via_type-' . $num)[$key],
                        'job_ref'  => $jobRef,
                        'name'     => $request->input('name-' . $num)[$key],
                        'address1' => $value,
                        'address2' => $request->input('address2-' . $num)[$key],
                        'area'     => $request->input('area-' . $num)[$key],
                        'country'  => $request->input('country-' . $num)[$key],
                        'postcode' => $request->input('postcode-' . $num)[$key],
                        'phone'    => $request->input('phone-' . $num)[$key],
                        'contact'  => $request->input('contact-' . $num)[$key],
                        'notes'    => $request->input('notes-' . $num)[$key],
                        'via_date' => $this->dateYMD($request->input('via_date-' . $num)[$key]),
                        'via_time' => $request->input('via_time-' . $num)[$key],
                    ]);
                }
            }
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private function buildViaData(Request $request, int $num, int $key, int $jobRef, int $userId): array
    {
        return [
            'user_id'               => $userId,
            'job_ref'               => $jobRef,
            'via_type'              => $request->input('via_type-' . $num)[$key],
            'name'                  => $request->input('name-' . $num)[$key],
            'address1'              => $request->input('address1-' . $num)[$key],
            'address2'              => $request->input('address2-' . $num)[$key],
            'area'                  => $request->input('area-' . $num)[$key],
            'country'               => $request->input('country-' . $num)[$key],
            'postcode'              => $request->input('postcode-' . $num)[$key],
            'phone'                 => $request->input('phone-' . $num)[$key],
            'contact'               => $request->input('contact-' . $num)[$key],
            'notes'                 => $request->input('notes-' . $num)[$key],
            'signed_by'             => $request->input('signed_by-' . $num)[$key] ?? null,
            'date'                  => $this->dateYMD($request->input('pod_date-' . $num)[$key] ?? null),
            'time'                  => $request->input('pod_time-' . $num)[$key] ?? null,
            'via_date'              => $this->dateYMD($request->input('via_date-' . $num)[$key] ?? null),
            'via_time'              => $request->input('via_time-' . $num)[$key] ?? null,
            'delivered_temperature' => $request->input('delivered_temperature-' . $num)[$key] ?? null,
        ];
    }

    private function buildViaUpdateData(Request $request, int $num, int $key, int $jobRef): array
    {
        return [
            'via_type'              => $request->input('via_type-' . $num)[$key],
            'job_ref'               => $jobRef,
            'name'                  => $request->input('name-' . $num)[$key],
            'address1'              => $request->input('address1-' . $num)[$key],
            'address2'              => $request->input('address2-' . $num)[$key],
            'area'                  => $request->input('area-' . $num)[$key],
            'country'               => $request->input('country-' . $num)[$key],
            'postcode'              => $request->input('postcode-' . $num)[$key],
            'phone'                 => $request->input('phone-' . $num)[$key],
            'contact'               => $request->input('contact-' . $num)[$key],
            'notes'                 => $request->input('notes-' . $num)[$key],
            'signed_by'             => $request->input('signed_by-' . $num)[$key] ?? null,
            'date'                  => $this->dateYMD($request->input('pod_date-' . $num)[$key] ?? null),
            'time'                  => $request->input('pod_time-' . $num)[$key] ?? null,
            'via_date'              => $this->dateYMD($request->input('via_date-' . $num)[$key] ?? null),
            'via_time'              => $request->input('via_time-' . $num)[$key] ?? null,
            'delivered_temperature' => $request->input('delivered_temperature-' . $num)[$key] ?? null,
        ];
    }

    private function saveToAddressBook(Request $request, string $type, int $userId): void
    {
        $name = $request->input("{$type}_name");
        if (! $name) {
            return;
        }

        Viaaddress::firstOrCreate(
            ['name' => $name],
            [
                'user_id'  => $userId,
                'job_ref'  => '',
                'via_type' => ucfirst($type),
                'name'     => $name,
                'address1' => $request->input("{$type}_address1"),
                'address2' => $request->input("{$type}_address2"),
                'area'     => $request->input("{$type}_area"),
                'country'  => $request->input("{$type}_country"),
                'postcode' => $request->input("{$type}_postcode"),
                'notes'    => $request->input("{$type}_notes"),
                'phone'    => $request->input("{$type}_phone"),
                'contact'  => $request->input("{$type}_contact"),
            ]
        );
    }

    private function dateYMD(?string $date): ?string
    {
        if (! $date) {
            return null;
        }
        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}