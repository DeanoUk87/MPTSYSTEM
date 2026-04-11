<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\CustomQueries;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Booking;
use App\Models\Customers;
use App\Models\Drivers;
use App\Models\Vehicles;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HomeController extends Controller
{
    use CustomQueries;
    use Uploader;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verified', '2fa']);
    }

    /**
     * Show the application dashboard.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (! Auth::user()->hasAnyRole('driver', 'user', 'customer')) {
            $date1 = $request->input('date1');
            $date2 = $request->input('date2');
            if ($date1 and $date2) {
                $fromDate = Carbon::parse($date1, config('timezone'))->format('Y-m-d');
                $toDate = Carbon::parse($date2, config('timezone'))->format('Y-m-d');
                $users = User::count();
                $customers = Customers::count();
                $drivers = Drivers::count();
                $vehicles = Vehicles::count();

                $bookingCount = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->count();
                $booking = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
                $driverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('driver_cost');
                $subConCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost');
                $extraCost2 = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost2');
                $cxDriverCost = Booking::whereBetween('delivery_date', [$fromDate, $toDate])->where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cxdriver_cost');
                $profit = ($booking + $extraCost2) - $driverCost - $subConCost - $cxDriverCost;
            } else {
                $users = User::count();
                $customers = Customers::count();
                $drivers = Drivers::count();
                $vehicles = Vehicles::count();
                $bookingCount = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->count();
                $booking = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cost');
                $driverCost = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('driver_cost');
                $subConCost = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost');
                $extraCost2 = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('extra_cost2');
                $cxDriverCost = Booking::where('booking_type', '!=', 'Quote')->where('job_status', 1)->sum('cxdriver_cost');
                $profit = ($booking + $extraCost2) - $driverCost - $subConCost - $cxDriverCost;
            }
        } else {
            $users = 1;
            $userid = $this->memberId();
            $customers = Customers::where('user_id', $userid)->count();
            $drivers = Drivers::where('user_id', $userid)->count();
            $vehicles = Vehicles::where('user_id', $userid)->count();
            $bookingCount = Booking::where('user_id', $userid)->where('booking_type', '!=', 'Quote')->count();
            $booking = Booking::where('user_id', $userid)->where('booking_type', '!=', 'Quote')->sum('cost');
            $driverCost = Booking::where('user_id', $userid)->where('booking_type', '!=', 'Quote')->sum('driver_cost');
            $subConCost = Booking::where('user_id', $userid)->where('booking_type', '!=', 'Quote')->sum('extra_cost');
            $extraCost2 = Booking::where('booking_type', '!=', 'Quote')->sum('extra_cost2');
            $profit = $booking - $driverCost - $subConCost;
        }
        // For drivers access
        if (Auth::user()->hasRole('driver')) {
            $driverId = Auth::user()->driverId;
            if ($request->input('date1')) {
                $fromDate = Carbon::parse($request->input('date1'), env('TIME_ZONE'))->format('Y-m-d');
                $toDate = Carbon::parse($request->input('date2'), env('TIME_ZONE'))->format('Y-m-d');
            } else {
                $fromDate = Carbon::now(config('timezone'))->format('Y-m-d');
                $toDate = Carbon::now(config('timezone'))->format('Y-m-d');
            }
            $booking = $this->queries($fromDate, $toDate, $user, '', $driverId, 2);

            return view('driverAccess.driver', compact('fromDate', 'toDate', 'driverId', 'booking'));
        }
        // For drivers access
        elseif (Auth::user()->hasRole('customer')) {
            $customerId = Auth::user()->customerId;
            if ($request->input('date1')) {
                $fromDate = Carbon::parse($request->input('date1'), env('TIME_ZONE'))->format('Y-m-d');
                $toDate = Carbon::parse($request->input('date2'), env('TIME_ZONE'))->format('Y-m-d');
            } else {
                $fromDate = Carbon::now(config('timezone'))->format('Y-m-d');
                $toDate = Carbon::now(config('timezone'))->format('Y-m-d');
            }
            $booking = $this->queries($fromDate, $toDate, $user, $customerId, '', 2);

            return view('customerAccess.index', compact('fromDate', 'toDate', 'customerId', 'booking'));
        }
        // end driver access
        else {
            return view('sysadmin.index', compact('users', 'user', 'customers', 'booking', 'drivers', 'profit', 'vehicles', 'driverCost', 'subConCost','cxDriverCost', 'bookingCount', 'date1','date2'));
        }
    }

    public function driverUnits()
    {
        if (! Auth::user()->hasRole('driver')) {
            return redirect()->route('home');
        }

        $driverId = Auth::user()->driverId;

        $contactIds = \App\Models\Driverscontact::where('driver_id', $driverId)->pluck('id')->toArray();
        $allIds = array_merge([$driverId], $contactIds);
        $units = \App\Models\Storages::whereIn('current_driver', $allIds)->orderBy('unit_number')->get();

        $tempMap = [];
        try {
            $service = app(\App\Services\StorageService::class);
            $sensorData = $service->getSensorData();
            foreach ($sensorData['mergedData'] as $item) {
                if (isset($item['imei'])) {
                    $tempMap[$item['imei']] = $item['temperature'] ?? null;
                }
            }
        } catch (\Exception $e) {
            // sensor API unavailable — temperatures will show as --
        }

        $units->each(function ($unit) use ($tempMap) {
            $unit->liveTemperature = ($unit->imei && isset($tempMap[$unit->imei])) ? $tempMap[$unit->imei] : null;
        });

        return view('driverAccess.units', compact('units'));
    }

    public function driverUnitLocation(string $imei)
    {
        if (! Auth::user()->hasRole('driver')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $driverId   = Auth::user()->driverId;
        $contactIds = \App\Models\Driverscontact::where('driver_id', $driverId)->pluck('id')->toArray();
        $allIds     = array_merge([$driverId], $contactIds);

        // Confirm this IMEI belongs to one of the driver's own units
        $unit = \App\Models\Storages::whereIn('current_driver', $allIds)
            ->where('imei', $imei)
            ->first();

        if (! $unit) {
            return response()->json(['error' => 'Unit not found'], 404);
        }

        try {
            $service   = app(\App\Services\StorageService::class);
            $locations = $service->getUnitLocations([$imei]);

            $p = collect($locations)->firstWhere('imei', $imei);

            if (! $p || ! isset($p['lat']) || ! isset($p['lng'])) {
                return response()->json(['error' => 'Location not available'], 404);
            }

            return response()->json([
                'unit_number' => $unit->unit_number,
                'lat'         => (float) $p['lat'],
                'lng'         => (float) $p['lng'],
                'address'     => $p['address'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Could not retrieve location'], 500);
        }
    }

    public function driverStorageAlerts()
    {
        if (! Auth::user()->hasRole('driver')) {
            return response()->json(['messageCount' => 0, 'messages' => []]);
        }

        $driverId   = Auth::user()->driverId;
        $contactIds = \App\Models\Driverscontact::where('driver_id', $driverId)->pluck('id')->toArray();
        $allIds     = array_merge([$driverId], $contactIds);

        // Get IMEIs for this driver's trackable units only
        $myImeis = \App\Models\Storages::whereIn('current_driver', $allIds)
            ->where('trackable', 1)
            ->pluck('imei')
            ->filter()
            ->values()
            ->toArray();

        if (empty($myImeis)) {
            return response()->json(['messageCount' => 0, 'messages' => []]);
        }

        try {
            $service  = app(\App\Services\StorageService::class);
            $data     = $service->getSensorData();
            $messages = array_values(array_filter($data['messages'], function ($msg) use ($myImeis) {
                foreach ($myImeis as $imei) {
                    if (str_contains($msg, $imei)) return true;
                }
                return false;
            }));

            return response()->json([
                'messageCount' => count($messages),
                'messages'     => $messages,
            ]);
        } catch (\Exception $e) {
            return response()->json(['messageCount' => 0, 'messages' => []]);
        }
    }
}
