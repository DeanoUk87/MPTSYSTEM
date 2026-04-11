<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Viaaddress;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use PDF;

class MailJob extends Mailable
{
    use Queueable, SerializesModels;

    public $jobRef;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($jobRef)
    {
        $this->jobRef = $jobRef;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {

        $booking = Booking::LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->LeftJoin('user_settings', 'user_settings.user_id', '=', 'booking.user_id')
            ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->select('booking.*', 'user_settings.*', 'customers.customer', 'customers.account_number as customerId',
                'vehicles.name as vehicleName',
                'drivers.driver as driverName', 'drivers.driver_email', 'drivers.driver_phone',
                'drivers_1.driver as driverName', 'drivers_1.driver_email', 'drivers_1.driver_phone'
            )
            ->where('job_ref', $this->jobRef)->first();
        $viaAddresses = Viaaddress::where('job_ref', $this->jobRef)->whereNull('deleted_at')->orderBy('via_id')->get();
        $pdf = PDF::loadView('admin.booking.print-details', compact('booking', 'viaAddresses'));

        // pdf
        $pdf->setPaper([0, 0, 620.78, 980.94], 'A4');
        $jobRef = $booking->customerId.'-'.$booking->job_ref;
        $company = $booking->business_name;
        $job_message = $booking->job_message;
        $logo = $booking->upload_logo;

        $find = ['{jobRef}', '{company}'];
        $replace = [$jobRef, $company];
        $theMessage = (str_replace($find, $replace, $job_message));

        // mail
        return $this->view('mail.mailJob', compact('jobRef', 'company', 'theMessage', 'logo'))
            ->subject($booking->business_name.': Job Sheet '.$booking->job_ref)
            ->from($booking->email_address, $booking->business_name)
            ->attachData($pdf->output(), 'booking_'.$booking->job_ref.'.pdf');
    }
}
