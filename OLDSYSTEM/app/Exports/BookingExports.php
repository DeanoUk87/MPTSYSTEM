<?php

/*
* =======================================================================
* FILE NAME:        BookingExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		booking
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Booking;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class BookingExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Booking::all(['user_id', 'customer', 'customer_price', 'purchase_order', 'miles', 'cost', 'time_covered', 'collection_date', 'collection_time', 'collection_name', 'collection_address1', 'collection_address2', 'collection_area', 'collection_country', 'collection_postcode', 'collection_contact', 'collection_phone', 'collection_notes', 'delivery_date', 'delivery_time', 'delivery_name', 'delivery_address1', 'delivery_address2', 'delivery_area', 'delivery_country', 'delivery_postcode', 'delivery_phone', 'delivery_contact', 'delivery_notes', 'pod_signature', 'pod_time', 'pod_date', 'invoice_number', 'office_notes', 'vehicle', 'driver', 'driver_cost', 'second_man', 'extra_cost', 'extra_cost2', 'created_by', 'updated_by', 'created_at', 'updated_at', 'booked_by', 'number_of_items', 'weight', 'booking_type', 'pod_upload', 'job_status', 'manual_amount', 'manual_desc', 'extra_cost2_label', 'wait_and_return', 'dead_mileage_status']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'customer', 'customer_price', 'purchase_order', 'miles', 'cost', 'time_covered', 'collection_date', 'collection_time', 'collection_name', 'collection_address1', 'collection_address2', 'collection_area', 'collection_country', 'collection_postcode', 'collection_contact', 'collection_phone', 'collection_notes', 'delivery_date', 'delivery_time', 'delivery_name', 'delivery_address1', 'delivery_address2', 'delivery_area', 'delivery_country', 'delivery_postcode', 'delivery_phone', 'delivery_contact', 'delivery_notes', 'pod_signature', 'pod_time', 'pod_date', 'invoice_number', 'office_notes', 'vehicle', 'driver', 'driver_cost', 'second_man', 'extra_cost', 'extra_cost2', 'created_by', 'updated_by', 'created_at', 'updated_at', 'booked_by', 'number_of_items', 'weight', 'booking_type', 'pod_upload', 'job_status', 'manual_amount', 'manual_desc', 'extra_cost2_label', 'wait_and_return', 'dead_mileage_status'];
    }
}
