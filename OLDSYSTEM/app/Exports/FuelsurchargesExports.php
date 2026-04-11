<?php

/*
* =======================================================================
* FILE NAME:        FuelsurchargesExports.php
* DATE CREATED:  	08-08-2022
* FOR TABLE:  		fuel_surcharges
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Fuelsurcharges;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class FuelsurchargesExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Fuelsurcharges::all(['price', 'percentage', 'created_at', 'updated_at']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['price', 'percentage', 'created_at', 'updated_at'];
    }
}
