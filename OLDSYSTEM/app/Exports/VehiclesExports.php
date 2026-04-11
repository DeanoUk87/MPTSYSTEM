<?php

/*
* =======================================================================
* FILE NAME:        VehiclesExports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		vehicles
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Vehicles;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VehiclesExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Vehicles::all(['user_id', 'driver_id', 'name', 'cost_per_mile']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'driver_id', 'name', 'cost_per_mile'];
    }
}
