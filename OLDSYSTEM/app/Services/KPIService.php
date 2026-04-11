<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Customers;
use App\Models\Customervehiclerates;
use App\Models\Storages;
use App\Models\Storageusage;
use App\Models\Vehicles;
use App\Models\Viaaddress;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class KPIService
{
    /**
     * customer bookings statistics
     *
     * @return array
     */
    public function customersData($fromDate, $toDate, $subFromDate, $subToDate, $customer = null)
    {
        if ($customer) {
            $customers = Customers::where('customer', $customer)->count();
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $currentD = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->distinct('customer')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $previousD = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->distinct('customer')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $average = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('customer', $customer)->avg('cost') ?? 0;
        } else {
            $customers = Customers::count();
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->count();
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->count();
            $currentD = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->distinct('customer')->where('booking_type', '!=', 'Quote')->count();
            $previousD = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->distinct('customer')->where('booking_type', '!=', 'Quote')->count();
            $average = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->avg('cost') ?? 0;
        }

        return [
            'customers' => $customers,
            'current' => $current,
            'previous' => $previous,
            'currentD' => $currentD,
            'previousD' => $previousD,
            'average' => $average,
        ];
    }

    /**
     * Vehicles used
     *
     * @return array
     */
    public function vehiclesData($fromDate, $toDate, $subFromDate, $subToDate, $customer = null)
    {
        $vehicles = Vehicles::count();
        if ($customer) {
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $currentD = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->distinct('vehicle')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $previousD = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->distinct('vehicle')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
            $average = Customervehiclerates::avg('rate_per_mile') ?? 0;
        } else {
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->count();
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->count();
            $currentD = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->distinct('vehicle')->where('booking_type', '!=', 'Quote')->count();
            $previousD = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->distinct('vehicle')->where('booking_type', '!=', 'Quote')->count();
            $average = Customervehiclerates::avg('rate_per_mile') ?? 0;
        }

        return [
            'vehicles' => $vehicles,
            'current' => $current,
            'previous' => $previous,
            'currentD' => $currentD,
            'previousD' => $previousD,
            'average' => $average,
        ];
    }

    /**
     * Revenue
     *
     * @return array
     */
    public function revenueData($fromDate, $toDate, $subFromDate, $subToDate, $customer = null)
    {
        if ($customer) {
            $revenue = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->where('customer', $customer)->sum('cost');
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->where('customer', $customer)->sum('cost');
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->where('customer', $customer)->sum('cost');
            $average = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->where('customer', $customer)->avg('cost');
        } else {
            $revenue = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
            $current = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
            $previous = Booking::whereBetween('delivery_date', [$subFromDate, $subToDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
            $average = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('cost');
        }

        return [
            'revenue' => $revenue,
            'current' => $current,
            'previous' => $previous,
            'average' => $average,
        ];
    }

    /**
     * doughnut/pie chart
     *
     * @param  string  $cal
     * @return mixed
     */
    public function groupChart($year, $cal = 'normal', $customer = null)
    {
        if ($cal === 'profit') {
            if ($customer) {
                $booking = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->where('customer', $customer)->sum('cost');
                $driverCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->where('customer', $customer)->sum('driver_cost');
                $cxDriverCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->where('customer', $customer)->sum('cxdriver_cost');
                $extraCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->where('customer', $customer)->sum('extra_cost');
                $extraCost2 = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->where('customer', $customer)->sum('extra_cost2');
            } else {
                $booking = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->sum('cost');
                $driverCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->sum('driver_cost');
                $cxDriverCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->sum('cxdriver_cost');
                $extraCost = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->sum('extra_cost');
                $extraCost2 = Booking::where('booking_type', '!=', 'Quote')->whereYear('delivery_date', $year)->where('job_status', 1)->sum('extra_cost2');
            }
            $profit = ($booking + $extraCost2) - $driverCost - $extraCost - $cxDriverCost;

            return $profit;
        } else {
            return Booking::where('booking_type', '!=', 'Quote')
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->whereYear('delivery_date', $year)->where('job_status', 1)->sum('cost');
        }
    }

    /**
     * @param  string  $cal
     * @param  null  $fromDate
     * @param  null  $toDate
     * @return mixed
     */
    public function shippingStats($cal = 'normal', $fromDate = null, $toDate = null, $customer = null)
    {
        // not used currently
        if ($cal === 'normal') {
            $bookings = Booking::where('booking_type', '!=', 'Quote')->whereNotNull('pod_signature')->count();
            $via = Viaaddress::where('job_ref', '!=', '')->count();

            return $bookings + $via;
        } elseif ($cal === 'average') {
            if ($customer) {
                $bookingCount = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
                if ($bookingCount > 0) {
                    return Booking::select(DB::raw('ROUND(SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(pod_time, collection_time))))) AS time_diff'))
                        ->whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->where('customer', $customer)
                        ->first()->time_diff ?? '00:00';
                } else {
                    return '00:00';
                }
            } else {
                $bookingCount = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->count();
                if ($bookingCount > 0) {
                    return Booking::select(DB::raw('ROUND(SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(pod_time, collection_time))))) AS time_diff'))
                        ->whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')
                        ->first()->time_diff ?? '00:00';
                } else {
                    return '00:00';
                }
            }
        } else {
            if ($customer) {
                $bookings = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->count();
                $bookingData = Booking::select('job_ref')->whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->where('customer', $customer)->get()->toArray();
                $via = Viaaddress::whereIn('job_ref', $bookingData)->whereBetween('via_date', [$fromDate, $toDate])->count();
                if ($bookings) {
                    return $bookings + $via;
                }
            } else {
                $bookings = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->whereNotNull('pod_signature')->where('booking_type', '!=', 'Quote')->count();
                $via = Viaaddress::where('job_ref', '!=', '')->whereBetween('via_date', [$fromDate, $toDate])->count();
                if ($bookings) {
                    return $bookings + $via;
                }
            }
        }

    }

    /**
     * average count
     *
     * @return mixed
     */
    public function averageStats($table, $fromDate, $toDate, $customer = null)
    {
        if ($table === 'storage') {
            if ($customer) {
                $chill = Booking::select(DB::raw('count(*) as total'), DB::raw('DATE(created_at) as date'))
                    ->whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where('customer', $customer)->whereNotNull('chill_unit')->distinct('chill_unit')
                    ->groupBy('date')->get()->toArray();
                $amb = Booking::select(DB::raw('count(*) as total'), DB::raw('DATE(created_at) as date'))
                    ->whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where('customer', $customer)->whereNotNull('ambient_unit')->distinct('ambient_unit')
                    ->groupBy('date')->get()->toArray();

                $chillResult = collect($chill)->average('total');
                $ambResult = collect($amb)->average('total');

                return $chillResult + $ambResult;
            } else {
                $query = Storageusage::whereBetween('created_at', [$fromDate, $toDate])
                    ->select(DB::raw('count(*) as total'), DB::raw('DATE(created_at) as date'))
                    ->groupBy('date')
                    ->get()->toArray();

                return collect($query)->average('total');
            }

        }
        if ($table === 'customers') {
            $query = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->select(DB::raw('count(customer) as total'), DB::raw('DATE(delivery_date) as date'))
                ->distinct('customer')
                ->groupBy(['date', 'customer'])
                ->get()->toArray();

            return collect($query)->average('total');
        }
        if ($table === 'delivery') {
            $query = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->select(DB::raw('count(*) as total'))
                ->where('booking_type', '!=', 'Quote')
                ->where(function ($where) {
                    $where->where('driver', '!=', '')->where('second_man', '!=', '')->where('cxdriver', '!=', '');
                })
                ->groupBy('pod_date')
                ->get()->toArray();

            return collect($query)->average('total');
        }
        if ($table === 'booking') {
            $query = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->select(DB::raw('count(*) as total'), DB::raw('DATE(delivery_date) as date'))
                ->where('booking_type', '!=', 'Quote')
                ->groupBy('date')
                ->get()->toArray();

            return collect($query)->average('total');
        }
    }

    /**
     * storage
     *
     * @param  null  $fromDate
     * @param  null  $toDate
     * @return mixed
     */
    public function storageStats($fromDate = null, $toDate = null, $customer = null)
    {
        if ($fromDate and $toDate) {
            if ($customer) {
                $chill = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where('customer', $customer)->whereNotNull('chill_unit')->distinct('chill_unit')->count();
                $amb = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where('customer', $customer)->whereNotNull('ambient_unit')->distinct('ambient_unit')->count();

                return $chill + $amb;
            } else {
                return Storageusage::whereBetween('created_at', [$fromDate, $toDate])->count();
            }
        } else {
            return Storages::count();
        }
    }

    /**
     * profit
     *
     * @param  string  $cal
     * @param  null  $fromDate
     * @param  null  $toDate
     * @return mixed
     */
    public function profitStats($cal = 'normal', $fromDate = null, $toDate = null, $customer = null)
    {
        if ($cal === 'average') {
            $booking = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('cost');
            $driverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('driver_cost');
            $cxDriverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('cxdriver_cost');
            $extraCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('extra_cost');
            $extraCost2 = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->avg('extra_cost2');
            $profit = ($booking + $extraCost2) - $driverCost - $extraCost - $cxDriverCost;

            return $profit;
        } else {
            if ($fromDate and $toDate) {
                $booking = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where(function ($where) use ($customer) {
                        if ($customer) {
                            $where->where('customer', $customer);
                        }
                    })
                    ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
                $driverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where(function ($where) use ($customer) {
                        if ($customer) {
                            $where->where('customer', $customer);
                        }
                    })
                    ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('driver_cost');
                $cxDriverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where(function ($where) use ($customer) {
                        if ($customer) {
                            $where->where('customer', $customer);
                        }
                    })
                    ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cxdriver_cost');
                $extraCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where(function ($where) use ($customer) {
                        if ($customer) {
                            $where->where('customer', $customer);
                        }
                    })
                    ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost');
                $extraCost2 = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                    ->where(function ($where) use ($customer) {
                        if ($customer) {
                            $where->where('customer', $customer);
                        }
                    })
                    ->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost2');
                $profit = ($booking + $extraCost2) - $driverCost - $extraCost - $cxDriverCost;

                return $profit;
            } else {
                return (Booking::where('booking_type', '!=', 'Quote')->sum('cost') + Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost2')) - Booking::where('booking_type', '!=', 'Quote')->sum('driver_cost') - Booking::where('booking_type', '!=', 'Quote')->sum('extra_cost') - Booking::where('booking_type', '!=', 'Quote')->sum('cxdriver_cost');
            }
        }
    }

    /**
     * drivers
     *
     * @param  string  $cal
     * @param  null  $fromDate
     * @param  null  $toDate
     * @return mixed
     */
    public function driverStats($cal = 'normal', $fromDate = null, $toDate = null, $customer = null)
    {
        if ($cal === 'average') {
            $driver = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where('booking_type', '!=', 'Quote')
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->avg('driver_cost') ?? 0;
            $subDriver = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where('booking_type', '!=', 'Quote')
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->avg('extra_cost') ?? 0;
            $cxDriver = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where('booking_type', '!=', 'Quote')
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->avg('cxdriver_cost') ?? 0;

            return collect([$driver, $subDriver, $cxDriver])->average();
        } elseif ($cal === 'distinct') {
            $mainDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('driver', '!=', '')->distinct('driver')->count();
            $subDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('second_man', '!=', '')->distinct('second_man')->count();
            $cxDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('cxdriver', '!=', '')->distinct('cxdriver')->count();

            return $mainDriverUsed + $subDriverUsed + $cxDriverUsed;
        } else {
            $mainDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('driver', '!=', '')->count();
            $subDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('second_man', '!=', '')->count();
            $cxDriverUsed = Booking::whereBetween('delivery_date', [$fromDate, $toDate])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer', $customer);
                    }
                })
                ->where('cxdriver', '!=', '')->count();

            return $mainDriverUsed + $subDriverUsed + $cxDriverUsed;
        }
    }

    /**
     * rename date
     *
     * @param  null  $custom
     * @return array|string[]
     */
    public function reportLabel($report, $custom = null)
    {
        if ($custom) {
            $date1 = Carbon::parse(request()->input('date1'));
            $date2 = Carbon::parse(request()->input('date2'));
            $diff = $date1->diffInDays($date2);

            return [$date1->format('d/m/Y'), $date1->subDays($diff)->format('d/m/Y').'-'.$date2->subDays($diff)->format('d/m/Y')];
        } else {
            if ($report === 'today') {
                return ['Today', 'Yesterday'];
            } elseif ($report === 'week') {
                return ['This week', 'Last week'];
            } elseif ($report === 'month') {
                return ['This month', 'Last month'];
            } elseif ($report === 'quarter') {
                return ['This quarter', 'Last quarter'];
            } elseif ($report === 'half') {
                return ['This half', 'Last half'];
            } elseif ($report === 'year') {
                return ['This year', 'Last year'];
            } else {
                return ['Today', 'Yesterday'];
            }
        }
    }

    /**
     * get date
     *
     * @param  null  $custom
     * @return array
     */
    public function reportDate($report, $custom = null)
    {
        $now = Carbon::now();
        if ($report) {
            if ($report === 'today') {
                return [
                    'date1' => $now->format('Y-m-d'), 'date2' => $now->format('Y-m-d'),
                    'subDate1' => $now->subDay()->format('Y-m-d'), 'subDate2' => $now->format('Y-m-d'),
                ];
            } elseif ($report === 'week') {
                return [
                    'date1' => $now->startOfWeek()->format('Y-m-d'), 'date2' => $now->endOfWeek()->format('Y-m-d'),
                    'subDate1' => $now->subWeek()->startOfWeek()->format('Y-m-d'), 'subDate2' => $now->endOfWeek()->format('Y-m-d'),
                ];
            } elseif ($report === 'month') {
                return [
                    'date1' => $now->startOfMonth()->format('Y-m-d'), 'date2' => $now->endOfMonth()->format('Y-m-d'),
                    'subDate1' => $now->subMonth()->startOfMonth()->format('Y-m-d'), 'subDate2' => $now->endOfMonth()->format('Y-m-d'),
                ];
            } elseif ($report === 'quarter') {
                return [
                    'date1' => $now->startOfQuarter()->format('Y-m-d'), 'date2' => $now->endOfQuarter()->format('Y-m-d'),
                    'subDate1' => $now->subQuarter()->startOfQuarter()->format('Y-m-d'), 'subDate2' => $now->endOfQuarter()->format('Y-m-d'),
                ];
            } elseif ($report === 'half') {
                return [
                    'date1' => $now->startOfYear()->format('Y-m-d'), 'date2' => $now->startOfYear()->addMonths(6)->format('Y-m-d'),
                    'subDate1' => $now->startOfYear()->subMonths(6)->format('Y-m-d'), 'subDate2' => $now->addMonths(6)->format('Y-m-d'),
                ];
            } elseif ($report === 'year') {
                return [
                    'date1' => $now->startOfYear()->format('Y-m-d'), 'date2' => $now->endOfYear()->format('Y-m-d'),
                    'subDate1' => $now->subYear()->startOfYear()->format('Y-m-d'), 'subDate2' => $now->endOfYear()->format('Y-m-d'),
                ];
            } else {
                return [
                    'date1' => $now->format('Y-m-d'), 'date2' => $now->format('Y-m-d'),
                    'subDate1' => $now->subDay()->format('Y-m-d'), 'subDate2' => $now->subDay()->format('Y-m-d'),
                ];
            }
        } elseif ($custom) {
            $date1 = Carbon::parse(request()->input('date1'));
            $date2 = Carbon::parse(request()->input('date2'));
            $diff = $date1->diffInDays($date2);

            return [
                'date1' => $date1->format('Y-m-d'), 'date2' => $date2->format('Y-m-d'),
                'subDate1' => $date1->subDays($diff)->format('Y-m-d'), 'subDate2' => $date2->subDays($diff)->format('Y-m-d'),
            ];
        } else {
            return [
                'date1' => $now->format('Y-m-d'), 'date2' => $now->format('Y-m-d'),
                'subDate1' => $now->subDay()->format('Y-m-d'), 'subDate2' => $now->subDay()->format('Y-m-d'),
            ];
        }
    }

    /**
     * Monthly booking chart
     *
     * @return string
     */
    public function monthlyStarts($year, $customer = null)
    {
        $jobs = '';
        for ($n = 1; $n <= 12; $n++) {
            if ($n == 4 or $n == 6 or $n == 9 or $n == 11) {
                $day = 30;
            } elseif ($n == 2) {
                // check leap year
                if (date('L')) {
                    $day = 29;
                } else {
                    $day = 28;
                }
            } else {
                $day = 31;
            }
            $jobs .= Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)
                ->whereBetween('created_at', [$year.'-'.$n.'-'.'01', date('Y').'-'.$n.'-'.$day])
                ->where(function ($where) use ($customer) {
                    if ($customer) {
                        $where->where('customer',$customer);
                    }
                })
                ->sum('cost').',';
        }

        return $jobs;
    }
}
