<?php

/*
* =======================================================================
* FILE NAME:        DriversExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		drivers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Drivers;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class DriversExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Drivers::all(['user_id', 'driver_type', 'driver', 'driver_email', 'driver_phone', 'driver_address', 'driver_others', 'cost_per_mile', 'cost_per_mile_weekends', 'cost_per_mile_out_of_hours']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'driver_type', 'driver', 'driver_email', 'driver_phone', 'driver_address', 'driver_others', 'cost_per_mile', 'cost_per_mile_weekends', 'cost_per_mile_out_of_hours'];
    }
}
