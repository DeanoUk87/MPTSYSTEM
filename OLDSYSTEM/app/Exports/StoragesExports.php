<?php

/*
* =======================================================================
* FILE NAME:        StoragesExports.php
* DATE CREATED:  	11-05-2021
* FOR TABLE:  		storages
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Storages;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StoragesExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Storages::all(['unit_number', 'unit_size', 'availability', 'unit_type', 'current_driver', 'calibration_date']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['unit_number', 'unit_size', 'availability', 'unit_type', 'current_driver', 'calibration_date'];
    }
}
