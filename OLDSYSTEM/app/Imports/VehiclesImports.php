<?php

/*
* =======================================================================
* FILE NAME:        VehiclesImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		vehicles
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Vehicles;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class VehiclesImports implements ToModel, WithHeadingRow
{
    /**
     * @return Vehicles|null
     *                       To import data without header, remove WithHeadingRow from the class above
     *                       then use the format like this:  Vehicles(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Vehicles([
            'user_id' => $row['user_id'],
            'driver_id' => $row['driver_id'],
            'name' => $row['name'],
            'cost_per_mile' => $row['cost_per_mile'],

        ]);
    }
}
