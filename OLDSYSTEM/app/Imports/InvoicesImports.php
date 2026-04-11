<?php

/*
* =======================================================================
* FILE NAME:        InvoicesImports.php
* DATE CREATED:  	04-11-2020
* FOR TABLE:  		invoices
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Imports;

use App\Models\Invoices;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class InvoicesImports implements ToModel, WithHeadingRow
{
    /**
     * @return Invoices|null
     *                       To import data without header, remove WithHeadingRow from the class above
     *                       then use the format like this:  Invoices(['name' => $row[0],...])
     */
    public function model(array $row)
    {
        return new Invoices([
            'user_id' => $row['user_id'],
            'customer_id' => $row['customer_id'],
            'title' => $row['title'],
            'notes' => $row['notes'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'emailed' => $row['emailed'],

        ]);
    }
}
