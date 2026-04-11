<?php

/*
* =======================================================================
* FILE NAME:        GeotrackingImports.php
* DATE CREATED:  	14-07-2021
* FOR TABLE:  		geo_tracking
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Geotracking;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GeotrackingImports implements ToModel, WithHeadingRow
{
    /**
     * @return Geotracking|null
     *                          To import data without header, remove WithHeadingRow from the class above
     *                          then use the format like this:  Geotracking(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Geotracking([
            'user_id' => $row['user_id'],
            'driver_id' => $row['driver_id'],
            'job_id' => $row['job_id'],
            'current_lat' => $row['current_lat'],
            'current_lng' => $row['current_lng'],
            'current_date' => $row['current_date'],
            'status' => $row['status'],
            'speed' => $row['speed'],
            'started_lat' => $row['started_lat'],
            'started_lng' => $row['started_lng'],
            'ended_lat' => $row['ended_lat'],
            'ended_lng' => $row['ended_lng'],
            'started_at' => $row['started_at'],
            'ended_at' => $row['ended_at'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],

        ]);
    }
}
