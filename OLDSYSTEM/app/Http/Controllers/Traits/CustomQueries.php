<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait CustomQueries
{
    public function limit()
    {
        return 2000;
    }

    public function queries($fromdate = null, $todate = null, $cuser = null, $customer = null, $driver = null, $archive = null)
    {
        if (Auth::user()->hasRole('admin')) {
            $user = $cuser;
        } else {
            $user = $this->createdFor();
        }

        $dateval = 'booking.delivery_date';
        $collectionDate = 'booking.collection_date';
        // $dateval='booking.created_at';
        /****************************************
         * IF CUSTOMER ID EXIST
         * **********************************/
        if ($customer) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.customer', $customer)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.customer', $customer)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy',
                        'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.customer', $customer)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.customer', $customer)
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            }
        }
        /****************************************
         * IF DRIVER EXIST
         * *********************************/
        elseif ($driver) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            }
        }

        /****************************************
         * IF ARCHIVED READY FOR INVOICE
         * *********************************/
        elseif ($archive === 1) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) {
                        $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                    })
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) {
                        $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                    })
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where('booking.job_status', 1)
                    ->where(function ($query) {
                        $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) {
                        $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            }
        }

        /***************************************************
         * COMPLETED JOBS ONLY: FOR FINANCIAL STATEMENT/KPI
         * *************************************************/
        elseif ($archive === 2) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.job_status', 1)
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            }
        }

        /****************************************
         * IF NO DRIVER AND  CUSTOMER ID EXIST
         * *********************************/
        else {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.booking_type', '!=', 'Quote')
                    // ->where('booking.job_status',0)
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.booking_type', '!=', 'Quote')
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.booking_type', '!=', 'Quote')
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.booking_type', '!=', 'Quote')
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc')
                    ->limit($this->limit())
                    ->get();
            }
        }

    }

    public function queries2($fromdate = null, $todate = null, $cuser = null, $customer = null, $driver = null, $archive = null)
    {
        if (Auth::user()->hasRole('admin')) {
            $user = $cuser;
        } else {
            $user = $this->createdFor();
        }

        $dateval = 'booking.delivery_date';
        $collectionDate = 'booking.collection_date';
        // $dateval='booking.created_at';
        /****************************************
         * IF CUSTOMER ID EXIST
         * **********************************/
        if ($customer) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.customer', $customer)
                    ->whereBetween(DB::raw('DATE('.$dateval.')'), [$fromdate, $todate])
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc');
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.customer', $customer)
                    // ->where('booking.job_status',0)
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    ->where('booking.customer', $customer)
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.customer', $customer)
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc');
            }
        }
        /****************************************
         * IF EXIST DRIVER EXIST
         * *********************************/
        elseif ($driver) {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    // ->where('booking.user_id', $user)
                    ->where(function ($query) use ($driver) {
                        if (Auth::user()->hasRole('driver') and ($driver === 100 or $driver === 101)) {
                            $query->where('booking.driver', 100)
                                ->orWhere('booking.driver', 101);
                        } else {
                            $query->where('booking.driver', $driver)
                                ->orWhere('booking.second_man', $driver);
                        }
                    })
                    // ->where('booking.job_status',0)
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc');
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    // ->where('booking.job_status',0)
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where(function ($query) use ($driver) {
                        $query->where('booking.driver', $driver)
                            ->orWhere('booking.second_man', $driver);
                    })
                    ->orderBy('job_ref', 'desc');
            }
        }
        /****************************************
         * IF NO DRIVER AND  CUSTOMER ID EXIST
         * *********************************/
        else {
            if ($fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    // ->where('booking.job_status',0)
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    ->orderBy('job_ref', 'desc');
            } elseif ($fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                        $query->whereBetween($dateval, [$fromdate, $todate])
                            ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                    })
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->where('booking.user_id', $user)
                    // ->where('booking.job_status',0)
                    ->orderBy('job_ref', 'desc');
            } elseif (! $fromdate and ! $user) {
                return DB::table('booking')
                    ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                    ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                    ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                    ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                    ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                    ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                    ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                        'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                        'vehicles.name as vehicleName',
                        'customers.account_number as customerId'
                    )
                    ->orderBy('job_ref', 'desc');
            }
        }

    }

    public function invoiceQueries($fromdate = null, $todate = null, $cuser = null, $customer = null, $driver = null, $archive = null, $btype = null)
    {
        if (Auth::user()->hasRole('admin')) {
            $user = $cuser;
        } else {
            $user = $this->createdFor();
        }

        $dateval = 'booking.delivery_date';
        $collectionDate = 'booking.collection_date';

        if ($fromdate and $user and $customer and $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.user_id', $user)
                ->where('booking.customer', $customer)
                ->where('booking.booking_type', $btype)
                ->where('booking.job_status', 1)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        } elseif ($fromdate and ! $user and $customer and ! $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status', 1)
                ->where('booking.customer', $customer)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        } elseif ($fromdate and ! $user and $customer and $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status', 1)
                ->where('booking.customer', $customer)
                ->where('booking.booking_type', $btype)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        } elseif ($fromdate and ! $user and ! $customer and $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status', 1)
                ->where('booking.booking_type', $btype)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        } elseif ($fromdate and ! $user and ! $customer and ! $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status', 1)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        } elseif (! $fromdate and $user and ! $customer and ! $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.user_id', $user)
                ->where('booking.job_status', 1)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->orderBy('job_ref', 'desc');
        } elseif (! $fromdate and ! $user and ! $customer and ! $btype) {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName', 'drivers_1.driver as secondMan', 'drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status', 1)
                ->where(function ($query) {
                    $query->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                })
                ->orderBy('job_ref', 'desc');
        } else {
            return DB::table('booking')
                ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
                ->LeftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
                ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
                ->select('booking.*', 'users.username', 'users_1.username as createdBy', 'customers.customer as customerName', 'customers.po_number',
                    'drivers.driver as driverName','drivers_1.driver as secondMan','drivers_2.driver as cxdriverName',
                    'vehicles.name as vehicleName',
                    'customers.account_number as customerId'
                )
                ->where('booking.job_status',1)
                ->where(function ($query) {
                    $query->where('booking.invoice_number','0')->orWhereNull('invoice_number');
                })
                ->where(function ($query) use ($dateval,$collectionDate,$fromdate,$todate) {
                    $query->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                })
                ->orderBy('job_ref', 'desc');
        }
    }
}
