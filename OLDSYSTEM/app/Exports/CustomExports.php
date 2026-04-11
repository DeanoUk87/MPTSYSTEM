<?php

/*
* =======================================================================
* FILE NAME:        CustomExports.php
* DATE CREATED:  	05-11-2020
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromArray;

class CustomExports implements FromArray
{
    use Exportable;

    protected $arrayData;

    public function __construct(array $arrayData)
    {
        $this->arrayData = $arrayData;
    }

    public function array(): array
    {
        return $this->arrayData;
    }
}
