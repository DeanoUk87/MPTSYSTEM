<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Customers;
use App\Models\Invoices;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use PDF;

class MailInvoice extends Mailable
{
    use Queueable, SerializesModels;

    public $invoice_number;

    public $customer;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($invoice_number, $customer)
    {
        $this->invoice_number = $invoice_number;
        $this->customer = $customer;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $invoices = Invoices::LeftJoin('user_settings', 'user_settings.user_id', '=', 'invoices.user_id')
            ->where('invoice_number', $this->invoice_number)
            ->first();
        $bookings = Booking::where('invoice_number', $this->invoice_number)->get();
        $customer = Customers::where('customer_id', $this->customer)->first();
        $subtotal = Booking::where('invoice_number', $this->invoice_number)->sum('cost');
        $vat = ($subtotal * env('VAT')) / 100;
        $total = $subtotal + $vat;

        $pdf = PDF::loadView('admin.invoices.print-details', compact('invoices', 'bookings', 'customer', 'subtotal', 'vat', 'total'));
        // pdf
        $pdf->setPaper([0, -30, 620.78, 950.94], 'A4');

        $invoice_number = $this->invoice_number;
        $company = $invoices->business_name;
        $invoice_message = $invoices->invoice_message;
        $logo = $invoices->upload_logo;

        $find = ['{invoice_number}', '{company}'];
        $replace = [$invoice_number, $company];
        $theMessage = (str_replace($find, $replace, $invoice_message));

        // mail
        return $this->view('mail.mailInvoice', compact('invoice_number', 'company', 'theMessage', 'logo'))
            ->subject($company.': INVOICE-'.$this->invoice_number)
            ->from($invoices->email_address, $company)
            ->attachData($pdf->output(), 'invoice_'.$this->invoice_number.'.pdf');
    }
}
