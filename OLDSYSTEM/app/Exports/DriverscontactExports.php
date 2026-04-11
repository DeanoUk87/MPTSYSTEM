<?php

/*
* =======================================================================
* FILE NAME:        DriverscontactExports.php
* DATE CREATED:  	11-05-2021
* FOR TABLE:  		drivers_contact
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Driverscontact;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class DriverscontactExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Driverscontact::all(['driver_id', 'driver_name', 'vehicle_make', 'vehicle_registeration', 'driver_phone', 'created_at', 'updated_at']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['driver_id', 'driver_name', 'vehicle_make', 'vehicle_registeration', 'driver_phone', 'created_at', 'updated_at'];
    }
}
