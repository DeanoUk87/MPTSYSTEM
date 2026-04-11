<?php

/*
* =======================================================================
* FILE NAME:        CustomersImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		customers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Customers;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CustomersImports implements ToModel, WithHeadingRow
{
    /**
     * @return Customers|null
     *                        To import data without header, remove WithHeadingRow from the class above
     *                        then use the format like this:  Customers(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Customers([
            'user_id' => $row['user_id'],
            'account_number' => $row['account_number'],
            'customer' => $row['customer'],
            'email' => $row['email'],
            'phone' => $row['phone'],
            'address' => $row['address'],
            'address2' => $row['address2'],
            'address3' => $row['address3'],
            'city' => $row['city'],
            'postcode' => $row['postcode'],
            'notes' => $row['notes'],
            'po_number' => $row['po_number'],
            'po_email' => $row['po_email'],
            'contact' => $row['contact'],
            'dead_mileage' => $row['dead_mileage'],

        ]);
    }
}
