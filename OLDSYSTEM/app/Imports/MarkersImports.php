<?php

/*
* =======================================================================
* FILE NAME:        MarkersImports.php
* DATE CREATED:  	06-04-2021
* FOR TABLE:  		markers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Markers;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class MarkersImports implements ToModel, WithHeadingRow
{
    /**
     * @return Markers|null
     *                      To import data without header, remove WithHeadingRow from the class above
     *                      then use the format like this:  Markers(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Markers([
            'postcode' => $row['postcode'],
        ]);
    }
}
