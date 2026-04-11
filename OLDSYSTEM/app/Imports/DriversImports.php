<?php

/*
* =======================================================================
* FILE NAME:        DriversImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		drivers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Drivers;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DriversImports implements ToModel, WithHeadingRow
{
    /**
     * @return Drivers|null
     *                      To import data without header, remove WithHeadingRow from the class above
     *                      then use the format like this:  Drivers(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Drivers([
            'user_id' => $row['user_id'],
            'driver_type' => $row['driver_type'],
            'driver' => $row['driver'],
            'driver_email' => $row['driver_email'],
            'driver_phone' => $row['driver_phone'],
            'driver_address' => $row['driver_address'],
            'driver_others' => $row['driver_others'],
            'cost_per_mile' => $row['cost_per_mile'],
            'cost_per_mile_weekends' => $row['cost_per_mile_weekends'] ?? null,
            'cost_per_mile_out_of_hours' => $row['cost_per_mile_out_of_hours'] ?? null,

        ]);
    }
}
