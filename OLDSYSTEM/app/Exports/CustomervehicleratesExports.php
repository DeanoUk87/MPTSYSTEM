<?php

/*
* =======================================================================
* FILE NAME:        CustomervehicleratesExports.php
* DATE CREATED:  	14-11-2020
* FOR TABLE:  		customer_vehicle_rates
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Customervehiclerates;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CustomervehicleratesExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Customervehiclerates::all(['customer_id', 'vehicle_id', 'rate_per_mile']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['customer_id', 'vehicle_id', 'rate_per_mile'];
    }
}
