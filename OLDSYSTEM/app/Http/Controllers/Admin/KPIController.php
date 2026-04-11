<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use App\Models\Drivers;
use App\Services\KPIService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KPIController extends Controller
{
    private $kpiService;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct(KPIService $kpiService)
    {
        $this->middleware(['auth', 'verifier', '2fa']);
        $this->kpiService = $kpiService;
    }

    /**
     * Show the application dashboard.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (Auth::user()->hasRole('admin')) {

            $year = Carbon::now()->format('Y');
            $report = $request->input('report');
            $custom = $request->input('custom');

            $reportName = $this->kpiService->reportLabel($report, $custom);
            $date = $this->kpiService->reportDate($report, $custom);

            $date1 = Carbon::parse($date['date1'])->format('d-m-Y');
            $date2 = Carbon::parse($date['date2'])->format('d-m-Y');
            // previous
            $subDate1 = Carbon::parse($date['subDate1'])->format('d-m-Y');
            $subDate2 = Carbon::parse($date['subDate2'])->format('d-m-Y');

            // restructure date and pass to db
            $fromDate = Carbon::parse($date1)->format('Y-m-d');
            $toDate = Carbon::parse($date2)->format('Y-m-d');
            // previous
            $subFromDate = Carbon::parse($subDate1)->format('Y-m-d');
            $subToDate = Carbon::parse($subDate2)->format('Y-m-d');

            // customer
            if ($request->input('customer') and strlen($request->input('customer')) > 0) {
                $customer = $request->input('customer');
                if ($customer > 0) {
                    $customerName = Customers::where('customer_id', $customer)->first()->customer;
                }
            } else {
                $customer = 0;
                $customerName = 0;
            }

            // customers
            $customers = $this->kpiService->customersData($fromDate, $toDate, $subFromDate, $subToDate, $customer);
            // Drivers
            $drivers = [
                'drivers' => Drivers::count(),
                'current' => $this->kpiService->driverStats('normal', $fromDate, $toDate, $customer),
                'previous' => $this->kpiService->driverStats('normal', $subFromDate, $subToDate, $customer),
                'currentD' => $this->kpiService->driverStats('distinct', $fromDate, $toDate, $customer),
                'previousD' => $this->kpiService->driverStats('distinct', $subFromDate, $subToDate, $customer),
                'average' => $this->kpiService->driverStats('average', $fromDate, $toDate, $customer),
            ];

            // Vehicles
            $vehicles = $this->kpiService->vehiclesData($fromDate, $toDate, $subFromDate, $subToDate, $customer);

            // shipments
            // $time = gmdate("H:i", 16847.0974);
            $shipments = [
                'shipments' => $this->kpiService->shippingStats('normal'),
                'current' => $this->kpiService->shippingStats('date', $fromDate, $toDate, $customer),
                'previous' => $this->kpiService->shippingStats('date', $subFromDate, $subToDate, $customer),
                'average' => $this->kpiService->shippingStats('average', $fromDate, $toDate, $customer),
            ];

            // revenue
            $revenue = $this->kpiService->revenueData($fromDate, $toDate, $subFromDate, $subToDate, $customer);

            // profit
            $profit = [
                'profit' => $this->kpiService->profitStats($customer),
                'current' => $this->kpiService->profitStats('normal', $fromDate, $toDate, $customer),
                'previous' => $this->kpiService->profitStats('normal', $subFromDate, $subToDate, $customer),
                'average' => $this->kpiService->profitStats('average', $fromDate, $toDate, $customer),
            ];

            // storage
            $storage = [
                'storage' => $this->kpiService->storageStats(),
                'current' => $this->kpiService->storageStats($fromDate, $toDate, $customer),
                'previous' => $this->kpiService->storageStats($subFromDate, $subToDate, $customer),
            ];

            // chart doughnut
            $chart = [
                'revCurrent' => $this->kpiService->groupChart($year, 'normal', $customer),
                'revPrevious' => $this->kpiService->groupChart($year - 1, 'normal', $customer),
                'proCurrent' => $this->kpiService->groupChart($year, 'profit', $customer),
                'proPrevious' => $this->kpiService->groupChart($year - 1, 'profit', $customer),
            ];
        }

        $thisYearStats = $this->kpiService->monthlyStarts($year, $customer);
        $lastYearStats = $this->kpiService->monthlyStarts($year - 1, $customer);

        $storageAvg = $this->kpiService->averageStats('storage', $fromDate, $toDate, $customer);
        $customerAvg = $this->kpiService->averageStats('customers', $fromDate, $toDate, $customer);
        $bookingAvg = $this->kpiService->averageStats('booking', $fromDate, $toDate, $customer);
        $deliveryAvg = $this->kpiService->averageStats('delivery', $fromDate, $toDate, $customer);

        return view('admin.kpi.index',
            compact('reportName', 'user', 'customers', 'drivers',
                'profit','revenue', 'vehicles', 'date1','date2','thisYearStats','lastYearStats',
                'year','shipments','storage','report','subDate1','subDate2',
                'storageAvg','customerAvg','bookingAvg','deliveryAvg','chart','custom',
                'customer', 'customerName'
            ));
    }
}
