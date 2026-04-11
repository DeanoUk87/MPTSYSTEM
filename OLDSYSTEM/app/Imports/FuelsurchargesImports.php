<?php

/*
* =======================================================================
* FILE NAME:        FuelsurchargesImports.php
* DATE CREATED:  	08-08-2022
* FOR TABLE:  		fuel_surcharges
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Fuelsurcharges;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class FuelsurchargesImports implements ToModel, WithHeadingRow
{
    /**
     * @return Fuelsurcharges|null
     *                             To import data without header, remove WithHeadingRow from the class above
     *                             then use the format like this:  Fuelsurcharges(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Fuelsurcharges([
            'price' => $row['price'],
            'percentage' => $row['percentage'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],

        ]);
    }
}
