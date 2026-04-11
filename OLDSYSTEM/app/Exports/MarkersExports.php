<?php

/*
* =======================================================================
* FILE NAME:        MarkersExports.php
* DATE CREATED:  	06-04-2021
* FOR TABLE:  		markers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Markers;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class MarkersExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Markers::all(['postcode']);
    }

    public function headings(): array
    {
        return ['postcode'];
    }
}
