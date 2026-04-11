<?php

/*
* =======================================================================
* FILE NAME:        CustomervehicleratesImports.php
* DATE CREATED:  	14-11-2020
* FOR TABLE:  		customer_vehicle_rates
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Customervehiclerates;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CustomervehicleratesImports implements ToModel, WithHeadingRow
{
    /**
     * @return Customervehiclerates|null
     *                                   To import data without header, remove WithHeadingRow from the class above
     *                                   then use the format like this:  Customervehiclerates(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Customervehiclerates([
            'customer_id' => $row['customer_id'],
            'vehicle_id' => $row['vehicle_id'],
            'rate_per_mile' => $row['rate_per_mile'],

        ]);
    }
}
