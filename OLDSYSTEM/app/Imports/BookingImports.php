<?php

/*
* =======================================================================
* FILE NAME:        BookingImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		booking
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Booking;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class BookingImports implements ToModel, WithHeadingRow
{
    /**
     * @return Booking|null
     *                      To import data without header, remove WithHeadingRow from the class above
     *                      then use the format like this:  Booking(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Booking([
            'user_id' => $row['user_id'],
            'customer' => $row['customer'],
            'customer_price' => $row['customer_price'],
            'purchase_order' => $row['purchase_order'],
            'miles' => $row['miles'],
            'cost' => $row['cost'],
            'time_covered' => $row['time_covered'],
            'collection_date' => $row['collection_date'],
            'collection_time' => $row['collection_time'],
            'collection_name' => $row['collection_name'],
            'collection_address1' => $row['collection_address1'],
            'collection_address2' => $row['collection_address2'],
            'collection_area' => $row['collection_area'],
            'collection_country' => $row['collection_country'],
            'collection_postcode' => $row['collection_postcode'],
            'collection_contact' => $row['collection_contact'],
            'collection_phone' => $row['collection_phone'],
            'collection_notes' => $row['collection_notes'],
            'delivery_date' => $row['delivery_date'],
            'delivery_time' => $row['delivery_time'],
            'delivery_name' => $row['delivery_name'],
            'delivery_address1' => $row['delivery_address1'],
            'delivery_address2' => $row['delivery_address2'],
            'delivery_area' => $row['delivery_area'],
            'delivery_country' => $row['delivery_country'],
            'delivery_postcode' => $row['delivery_postcode'],
            'delivery_phone' => $row['delivery_phone'],
            'delivery_contact' => $row['delivery_contact'],
            'delivery_notes' => $row['delivery_notes'],
            'pod_signature' => $row['pod_signature'],
            'pod_time' => $row['pod_time'],
            'pod_date' => $row['pod_date'],
            'invoice_number' => $row['invoice_number'],
            'office_notes' => $row['office_notes'],
            'vehicle' => $row['vehicle'],
            'driver' => $row['driver'],
            'driver_cost' => $row['driver_cost'],
            'second_man' => $row['second_man'],
            'extra_cost' => $row['extra_cost'],
            'extra_cost2' => $row['extra_cost2'],
            'created_by' => $row['created_by'],
            'updated_by' => $row['updated_by'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'booked_by' => $row['booked_by'],
            'number_of_items' => $row['number_of_items'],
            'weight' => $row['weight'],
            'booking_type' => $row['booking_type'],
            'pod_upload' => $row['pod_upload'],
            'job_status' => $row['job_status'],
            'manual_amount' => $row['manual_amount'],
            'manual_desc' => $row['manual_desc'],
            'extra_cost2_label' => $row['extra_cost2_label'],
            'wait_and_return' => $row['wait_and_return'],
            'dead_mileage_status' => $row['dead_mileage_status'],

        ]);
    }
}
