<?php

/*
* =======================================================================
* FILE NAME:        ViaaddressExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		via_address
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Viaaddress;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ViaaddressExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Viaaddress::all(['user_id', 'job_ref', 'via_type', 'address1', 'address2', 'area', 'country', 'postcode', 'notes', 'name', 'contact', 'phone', 'signed_by', 'date', 'time', 'via_date', 'via_time', 'deleted_at']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'job_ref', 'via_type', 'address1', 'address2', 'area', 'country', 'postcode', 'notes', 'name', 'contact', 'phone', 'signed_by', 'date', 'time', 'via_date', 'via_time', 'deleted_at'];
    }
}
