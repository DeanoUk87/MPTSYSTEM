<?php

/*
* =======================================================================
* FILE NAME:        DriverscontactImports.php
* DATE CREATED:  	11-05-2021
* FOR TABLE:  		drivers_contact
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Driverscontact;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DriverscontactImports implements ToModel, WithHeadingRow
{
    /**
     * @return Driverscontact|null
     *                             To import data without header, remove WithHeadingRow from the class above
     *                             then use the format like this:  Driverscontact(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Driverscontact([
            'driver_id' => $row['driver_id'],
            'driver_name' => $row['driver_name'],
            'vehicle_make' => $row['vehicle_make'],
            'vehicle_registeration' => $row['vehicle_registeration'],
            'driver_phone' => $row['driver_phone'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],

        ]);
    }
}
