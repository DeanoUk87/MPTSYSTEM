<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\Drivers;
use App\Models\Driverscontact;
use App\Notifications\AppNotification;
use Illuminate\Support\Facades\Notification;

class BookingNotificationService
{
    /**
     * Send a driver notification email when a driver is assigned to a booking.
     *
     * @param  Booking  $booking
     * @param  int|null  $driver
     * @param  int|null  $secondMan
     * @param  int|null  $cxdriver
     * @param  bool  $isNew  true when creating a new booking
     */
    public function notifyDriver(
        Booking $booking,
        ?int $driver = null,
        ?int $secondMan = null,
        ?int $cxdriver = null,
        bool $isNew = false
    ): void {
        $driverId = $this->resolveDriverId($booking, $driver, $secondMan, $cxdriver, $isNew);

        if (! $driverId) {
            return;
        }

        $driverInfo = Drivers::where('driver_id', $driverId)->first();

        if (! $driverInfo?->driver_email) {
            return;
        }

        $contactName = $this->resolveContactName($booking, $driverInfo);

        $details = [
            'subject'    => 'MP Transport LTD: Job Assigned to You',
            'from'       => config('mail.from.address'),
            'greeting'   => 'Hello ' . $driverInfo->driver,
            'body'       => 'A new job has just been assign to you',
            'itemCode'   => 'Job Number: <a href="#">' . $booking->job_ref . '</a>',
            'thanks'     => 'Driver Contact: ' . $contactName,
            'actionText' => 'Login to your account',
            'actionURL'  => url('/'),
        ];

        Notification::route('mail', $driverInfo->driver_email)
            ->notify(new AppNotification($details));
    }

    private function resolveDriverId(
        Booking $booking,
        ?int $driver,
        ?int $secondMan,
        ?int $cxdriver,
        bool $isNew
    ): ?int {
        if ($isNew) {
            return $driver ?? $secondMan ?? $cxdriver ?? null;
        }

        // Only notify if the driver slot was previously empty (newly attached)
        if ($driver   && ! $booking->driver)     return $driver;
        if ($secondMan && ! $booking->second_man) return $secondMan;
        if ($cxdriver  && ! $booking->cxdriver)   return $cxdriver;

        return null;
    }

    private function resolveContactName(Booking $booking, Drivers $driverInfo): string
    {
        $contact = $booking->driver_contact;

        if ($contact && Driverscontact::where('id', $contact)->exists()) {
            return Driverscontact::where('id', $contact)->value('driver_name');
        }

        return $driverInfo->driver;
    }
}