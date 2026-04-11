<?php

namespace App\Services\Booking;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BookingQueryService
{
    private int $limit = 2000;

    private function baseQuery(): Builder
    {
        return DB::table('booking')
            ->leftJoin('users', 'users.id', '=', 'booking.user_id')
            ->leftJoin('users as users_1', 'users_1.id', '=', 'booking.created_by')
            ->leftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->leftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->leftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->leftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->leftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
            ->select(
                'booking.*',
                'users.username',
                'users_1.username as createdBy',
                'customers.customer as customerName',
                'customers.po_number',
                'drivers.driver as driverName',
                'drivers_1.driver as secondMan',
                'drivers_2.driver as cxdriverName',
                'vehicles.name as vehicleName',
                'customers.account_number as customerId'
            );
    }

    private function resolveUser(?int $cuser): ?int
    {
        return Auth::user()->hasRole('admin') ? $cuser : auth()->user()->createdFor ?? null;
    }

    /**
     * General booking query used for exports, prints, customer/driver views.
     * Returns a collection (calls ->get()).
     */
    public function get(
        mixed $fromdate = null,
        mixed $todate = null,
        ?int $cuser = null,
        ?int $customer = null,
        ?int $driver = null,
        mixed $archive = null
    ): \Illuminate\Support\Collection {
        return $this->buildQuery($fromdate, $todate, $cuser, $customer, $driver, $archive)->get();
    }

    /**
     * Datatable-oriented query — returns a Builder (no ->get()) for DataTables.
     */
    public function builder(
        mixed $fromdate = null,
        mixed $todate = null,
        ?int $cuser = null,
        ?int $customer = null,
        ?int $driver = null,
        mixed $archive = null
    ): Builder {
        return $this->buildDatatableQuery($fromdate, $todate, $cuser, $customer, $driver, $archive);
    }

    private function buildQuery(
        mixed $fromdate,
        mixed $todate,
        ?int $cuser,
        ?int $customer,
        ?int $driver,
        mixed $archive
    ): Builder {
        $user = $this->resolveUser($cuser);
        $q = $this->baseQuery();

        if ($customer) {
            $q->where('booking.customer', $customer);
            if ($archive !== 2) {
                $q->where('booking.booking_type', '!=', 'Quote');
            }
        } elseif ($driver) {
            $q->where('booking.booking_type', '!=', 'Quote')
                ->where(function ($sub) use ($driver) {
                    $sub->where('booking.driver', $driver)
                        ->orWhere('booking.second_man', $driver);
                });
        } elseif ($archive === 1) {
            $q->where('booking.job_status', 1)
                ->where('booking.booking_type', '!=', 'Quote')
                ->where(function ($sub) {
                    $sub->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
                });
        } elseif ($archive === 2) {
            $q->where('booking.job_status', 1)
                ->where('booking.booking_type', '!=', 'Quote');
        } else {
            $q->where('booking.booking_type', '!=', 'Quote');
        }

        if ($user) {
            $q->where('booking.user_id', $user);
        }

        if ($fromdate) {
            $dateval = 'booking.delivery_date';
            $collectionDate = 'booking.collection_date';
            $q->where(function ($sub) use ($dateval, $collectionDate, $fromdate, $todate) {
                $sub->whereBetween($dateval, [$fromdate, $todate])
                    ->orWhereBetween($collectionDate, [$fromdate, $todate]);
            });
        }

        return $q->orderBy('job_ref', 'desc')->limit($this->limit);
    }

    private function buildDatatableQuery(
        mixed $fromdate,
        mixed $todate,
        ?int $cuser,
        ?int $customer,
        ?int $driver,
        mixed $archive
    ): Builder {
        $user = $this->resolveUser($cuser);
        $q = $this->baseQuery();
        $dateval = 'booking.delivery_date';
        $collectionDate = 'booking.collection_date';

        if ($customer) {
            $q->where('booking.customer', $customer);
            if ($user) {
                $q->where('booking.user_id', $user);
            }
            if ($fromdate) {
                $q->where(function ($sub) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $sub->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                });
            }
        } elseif ($driver) {
            $q->where(function ($sub) use ($driver) {
                if (Auth::user()->hasRole('driver') && in_array($driver, [100, 101])) {
                    $sub->where('booking.driver', 100)->orWhere('booking.driver', 101);
                } else {
                    $sub->where('booking.driver', $driver)->orWhere('booking.second_man', $driver);
                }
            });
            if ($fromdate) {
                $q->where(function ($sub) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $sub->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                });
            }
        } else {
            if ($user) {
                $q->where('booking.user_id', $user);
            }
            if ($fromdate) {
                $q->where(function ($sub) use ($dateval, $collectionDate, $fromdate, $todate) {
                    $sub->whereBetween($dateval, [$fromdate, $todate])
                        ->orWhereBetween($collectionDate, [$fromdate, $todate]);
                });
            }
        }

        return $q->orderBy('job_ref', 'desc');
    }

    /**
     * Invoice / archive query (used by InvoiceGen datatable).
     * Returns a Builder (no ->get()).
     */
    public function invoiceBuilder(
        mixed $fromdate = null,
        mixed $todate = null,
        ?int $cuser = null,
        ?int $customer = null,
        ?int $driver = null,
        mixed $archive = null,
        ?string $btype = null
    ): Builder {
        $user = $this->resolveUser($cuser);
        $dateval = 'booking.delivery_date';
        $collectionDate = 'booking.collection_date';

        $q = $this->baseQuery()
            ->where('booking.job_status', 1)
            ->where(function ($sub) {
                $sub->where('booking.invoice_number', '0')->orWhereNull('invoice_number');
            });

        if ($user) {
            $q->where('booking.user_id', $user);
        }
        if ($customer) {
            $q->where('booking.customer', $customer);
        }
        if ($btype) {
            $q->where('booking.booking_type', $btype);
        }
        if ($fromdate) {
            $q->where(function ($sub) use ($dateval, $collectionDate, $fromdate, $todate) {
                $sub->whereBetween($dateval, [$fromdate, $todate])
                    ->orWhereBetween($collectionDate, [$fromdate, $todate]);
            });
        }

        return $q->orderBy('job_ref', 'desc');
    }

    /**
     * Address autocomplete for collection or delivery fields.
     * $type must be 'collection' or 'delivery'.
     *
     * @return array<int, array{id: mixed, value: mixed, address1: mixed, address2: mixed, area: mixed, country: mixed, postcode: mixed}>
     */
    public function addressAutoComplete(string $term, string $type, ?int $userId = null): array
    {
        $nameCol = $type . '_name';
        $codeCol = $type . '_postcode';

        $query = DB::table('booking')
            ->where(fn ($q) => $q->where($nameCol, 'LIKE', '%' . $term . '%')
                ->orWhere($codeCol, 'LIKE', '%' . $term . '%'))
            ->groupBy('customer')
            ->limit(10);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->get()->map(fn ($r) => [
            'id'       => $r->customer,
            'value'    => $r->{$nameCol},
            'address1' => $r->{$type . '_address1'},
            'address2' => $r->{$type . '_address2'},
            'area'     => $r->{$type . '_area'},
            'country'  => $r->{$type . '_country'},
            'postcode' => $r->{$type . '_postcode'},
        ])->toArray();
    }

    /**
     * Jobs sharing the same collection/delivery postcode pair for a customer.
     * Optionally excludes a specific job reference (used when editing).
     *
     * @param int $customer
     * @param string $collectionPostcode
     * @param string $deliveryPostcode
     * @param int|null $excludeJobRef
     * @return Collection
     */
    public function similarJobs(int $customer, string $collectionPostcode, string $deliveryPostcode, ?int $excludeJobRef = null): Collection
    {
        $query = DB::table('booking')
            ->where('customer', $customer)
            ->where('collection_postcode', $collectionPostcode)
            ->where('delivery_postcode', $deliveryPostcode)
            ->limit(50);

        if ($excludeJobRef) {
            $query->where('job_ref', '!=', $excludeJobRef);
        }

        return $query->get();
    }

    /**
     * Full-text search across postcodes, job notes, customer, driver, and vehicle.
     * Also searches via_address postcodes and merges/deduplicates results.
     *
     * @param string $term
     * @return Collection
     */
    public function customSearch(string $term): Collection
    {
        $viaMatches = DB::table('booking')
            ->crossJoin('via_address', 'booking.job_ref', '=', 'via_address.job_ref')
            ->select('booking.*', 'via_address.postcode')
            ->where('via_address.postcode', 'like', '%' . $term . '%')
            ->groupBy('booking.job_ref')
            ->orderBy('booking.job_ref', 'desc')
            ->limit(30)
            ->get();

        $directMatches = DB::table('booking')
            ->crossJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->leftJoin('drivers',  'drivers.driver_id', '=', 'booking.driver')
            ->leftJoin('vehicles', 'vehicles.id',       '=', 'booking.vehicle')
            ->select('booking.*')
            ->where(fn ($q) => $q
                ->where('booking.collection_postcode', 'like', '%' . $term . '%')
                ->orWhere('booking.delivery_postcode',  'like', '%' . $term . '%')
                ->orWhere('booking.job_ref',            'like', '%' . $term . '%')
                ->orWhere('booking.job_notes',          'like', '%' . $term . '%')
                ->orWhere('customers.customer',         'like', '%' . $term . '%')
                ->orWhere('drivers.driver',             'like', '%' . $term . '%')
                ->orWhere('vehicles.name',              'like', '%' . $term . '%'))
            ->groupBy('booking.job_ref')
            ->orderBy('booking.job_ref', 'desc')
            ->limit(30)
            ->get();

        return $directMatches->merge($viaMatches)->unique('job_ref');
    }

    /**
     * Single booking record with all joins needed for the edit form.
     */
    public function forEdit(int $id): ?object
    {
        return DB::table('booking')
            ->leftJoin('users',                 'users.id',                        '=', 'booking.user_id')
            ->leftJoin('customers',             'customers.customer_id',           '=', 'booking.customer')
            ->leftJoin('drivers',               'drivers.driver_id',               '=', 'booking.driver')
            ->leftJoin('drivers as drivers_1',  'drivers_1.driver_id',             '=', 'booking.second_man')
            ->leftJoin('drivers as drivers_2',  'drivers_2.driver_id',             '=', 'booking.cxdriver')
            ->leftJoin('vehicles',              'vehicles.id',                     '=', 'booking.vehicle')
            ->leftJoin('customer_vehicle_rates','customer_vehicle_rates.customer_id', '=', 'booking.customer')
            ->leftJoin('storages',              'storages.id',                     '=', 'booking.chill_unit')
            ->leftJoin('storages as storages_1','storages_1.id',                   '=', 'booking.ambient_unit')
            ->select(
                'booking.*', 'users.username',
                'customers.customer as customerName', 'customers.po_number',
                'drivers.driver as driverName', 'drivers.driver_id as driverId',
                'drivers.cost_per_mile', 'drivers.cost_per_mile_weekends',
                'vehicles.name as vehicleName',
                'drivers_1.driver as secondMan',
                'drivers_2.driver as cxdriverName',
                'drivers_2.cost_per_mile as cxCostPerMile',
                'drivers_2.cost_per_mile_weekends as cxCostPerMileWeekends',
                'customer_vehicle_rates.rate_per_mile', 'vehicles.id as rateId',
                'storages.unit_number as chillUnit',   'storages_1.unit_number as ambientUnit',
                'storages.unit_size as chillSize',     'storages_1.unit_size as ambientSize'
            )
            ->where('booking.job_ref', $id)
            ->first();
    }
}