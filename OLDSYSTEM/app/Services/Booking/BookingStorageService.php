<?php

namespace App\Services\Booking;

use App\Models\Storages;
use App\Models\Storageusage;

class BookingStorageService
{
    /**
     * Assign a storage unit to a booking/driver combination.
     */
    public function assignUnit(?int $unitId, int $jobRef, int $driverId, bool $requireAvailable = true): void
    {
        if (! $unitId) {
            return;
        }

        $query = Storages::where('id', $unitId);

        if ($requireAvailable) {
            $query->where('availability', 'Yes');
        }

        if (! $query->count()) {
            return;
        }

        $query->update([
            'current_driver' => $driverId,
            'availability'   => 'No',
            'job_id'         => $jobRef,
        ]);

        Storageusage::updateOrCreate(
            ['job_id' => $jobRef, 'unit_id' => $unitId],
            ['unit_id' => $unitId, 'job_id' => $jobRef, 'driver_id' => $driverId]
        );
    }

    /**
     * Assign both chill and ambient units for a booking.
     */
    public function assignUnits(
        ?int $chillUnit,
        ?int $ambientUnit,
        int $jobRef,
        int $driverId,
        bool $requireAvailable = true
    ): void {
        $this->assignUnit($chillUnit, $jobRef, $driverId, $requireAvailable);
        $this->assignUnit($ambientUnit, $jobRef, $driverId, $requireAvailable);
    }
}