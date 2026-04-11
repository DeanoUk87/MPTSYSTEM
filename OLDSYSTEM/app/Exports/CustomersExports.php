<?php

/*
* =======================================================================
* FILE NAME:        CustomersExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		customers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Customers;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CustomersExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Customers::all(['user_id', 'account_number', 'customer', 'email', 'phone', 'address', 'address2', 'address3', 'city', 'postcode', 'notes', 'po_number', 'po_email', 'contact', 'dead_mileage']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'account_number', 'customer', 'email', 'phone', 'address', 'address2', 'address3', 'city', 'postcode', 'notes', 'po_number', 'po_email', 'contact', 'dead_mileage'];
    }
}
