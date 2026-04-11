<?php

/*
* =======================================================================
* FILE NAME:        JobaccessExports.php
* DATE CREATED:  	13-06-2022
* FOR TABLE:  		job_access
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use App\Models\Jobaccess;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class JobaccessExports implements FromCollection, WithHeadings
{
    use Exportable;

    public function collection()
    {
        return Jobaccess::all(['job_id', 'user_id', 'access', 'isRequest', 'created_at', 'updated_at']);
    }

    public function headings(): array
    {
        /* Remove header */
        // return [];

        /* Enable headers */
        return ['job_id', 'user_id', 'access', 'isRequest', 'created_at', 'updated_at'];
    }
}
