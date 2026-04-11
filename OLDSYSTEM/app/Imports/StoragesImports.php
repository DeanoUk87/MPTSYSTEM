<?php

/*
* =======================================================================
* FILE NAME:        StoragesImports.php
* DATE CREATED:  	11-05-2021
* FOR TABLE:  		storages
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Storages;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class StoragesImports implements ToModel, WithHeadingRow
{
    /**
     * @return Storages|null
     *                       To import data without header, remove WithHeadingRow from the class above
     *                       then use the format like this:  Storages(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Storages([
            'unit_number' => $row['unit_number'],
            'unit_size' => $row['unit_size'],
            'availability' => $row['availability'],
            'unit_type' => $row['unit_type'],
            'current_driver' => $row['current_driver'],
            'calibration_date' => $row['calibration_date'],
        ]);
    }
}
