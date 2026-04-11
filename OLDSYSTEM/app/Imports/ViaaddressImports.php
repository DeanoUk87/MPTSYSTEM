<?php

/*
* =======================================================================
* FILE NAME:        ViaaddressImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		via_address
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Viaaddress;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ViaaddressImports implements ToModel, WithHeadingRow
{
    /**
     * @return Viaaddress|null
     *                         To import data without header, remove WithHeadingRow from the class above
     *                         then use the format like this:  Viaaddress(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Viaaddress([
            'user_id' => $row['user_id'],
            'job_ref' => $row['job_ref'],
            'via_type' => $row['via_type'],
            'address1' => $row['address1'],
            'address2' => $row['address2'],
            'area' => $row['area'],
            'country' => $row['country'],
            'postcode' => $row['postcode'],
            'notes' => $row['notes'],
            'name' => $row['name'],
            'contact' => $row['contact'],
            'phone' => $row['phone'],
            'signed_by' => $row['signed_by'],
            'date' => $row['date'],
            'time' => $row['time'],
            'via_date' => $row['via_date'],
            'via_time' => $row['via_time'],
            'deleted_at' => $row['deleted_at'],

        ]);
    }
}
