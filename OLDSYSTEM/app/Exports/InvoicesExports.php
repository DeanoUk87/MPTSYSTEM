<?php

/*
* =======================================================================
* FILE NAME:        InvoicesExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		invoices
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Invoices;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class InvoicesExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Invoices::all(['user_id', 'customer_id', 'title', 'notes', 'created_at', 'updated_at', 'emailed']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'customer_id', 'title', 'notes', 'created_at', 'updated_at', 'emailed'];
    }
}
