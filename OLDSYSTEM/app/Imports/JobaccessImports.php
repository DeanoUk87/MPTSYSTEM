<?php

/*
* =======================================================================
* FILE NAME:        JobaccessImports.php
* DATE CREATED:  	13-06-2022
* FOR TABLE:  		job_access
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Jobaccess;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class JobaccessImports implements ToModel, WithHeadingRow
{
    /**
     * @return Jobaccess|null
     *                        To import data without header, remove WithHeadingRow from the class above
     *                        then use the format like this:  Jobaccess(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Jobaccess([
            'job_id' => $row['job_id'],
            'user_id' => $row['user_id'],
            'access' => $row['access'],
            'isRequest' => $row['isRequest'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],

        ]);
    }
}
