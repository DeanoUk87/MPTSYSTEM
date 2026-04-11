<?php

/*
* =======================================================================
* FILE NAME:        GeotrackingExports.php
* DATE CREATED:  	14-07-2021
* FOR TABLE:  		geo_tracking
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Geotracking;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GeotrackingExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Geotracking::all(['user_id', 'driver_id', 'job_id', 'current_lat', 'current_lng', 'current_date', 'status', 'speed', 'started_lat', 'started_lng', 'ended_lat', 'ended_lng', 'started_at', 'ended_at', 'created_at', 'updated_at']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['user_id', 'driver_id', 'job_id', 'current_lat', 'current_lng', 'current_date', 'status', 'speed', 'started_lat', 'started_lng', 'ended_lat', 'ended_lng', 'started_at', 'ended_at', 'created_at', 'updated_at'];
    }
}
