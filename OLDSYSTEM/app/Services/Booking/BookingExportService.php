<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\CollectedOrders;
use App\Models\Customers;
use App\Models\Drivers;
use App\Models\Usersettings;
use App\Models\Viaaddress;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

readonly class BookingExportService
{
    public function __construct(
        private BookingQueryService $queryService
    ) {}

    // ─── Print / PDF helpers shared by multiple export methods ──────────────

    private function buildExportContext(
        mixed $fromdate,
        mixed $todate,
        ?int $customer,
        ?int $driver
    ): array {
        $customerName = $customer
            ? Customers::where('customer_id', $customer)->value('customer') ?? ''
            : '';

        $driverName = $driver
            ? Drivers::where('driver_id', $driver)->value('driver') ?? ''
            : '';

        $dateFrom = $fromdate ? Carbon::parse($fromdate, config('timezone'))->format('dS M Y') : '';
        $dateTo   = $todate   ? Carbon::parse($todate,   config('timezone'))->format('dS M Y') : '';

        return compact('customerName', 'driverName', 'dateFrom', 'dateTo');
    }

    // ─── Print view ──────────────────────────────────────────────────────────

    public function printView(
        ?int $user,
        ?string $fromdate,
        ?string $todate,
        ?int $customer,
        ?int $driverId
    ): View {
        $driver  = Auth::user()->hasRole('driver') ? Auth::user()->driverId : $driverId;
        $booking = $this->queryService->get($fromdate, $todate, $user, $customer, $driver, 2);
        $ctx     = $this->buildExportContext($fromdate, $todate, $customer, $driver);

        $view = Auth::user()->hasRole('driver') ? 'driverAccess.print' : 'admin.booking.print';

        return view($view, array_merge(compact('booking'), $ctx));
    }

    // ─── List PDF ────────────────────────────────────────────────────────────

    public function downloadListPdf(
        ?int $user,
        ?string $fromdate,
        ?string $todate,
        ?int $customer,
        ?int $driverId
    ): Response {
        $driver  = Auth::user()->hasRole('driver') ? Auth::user()->driverId : $driverId;
        $booking = $this->queryService->get($fromdate, $todate, $user, $customer, $driver, 2);
        $ctx     = $this->buildExportContext($fromdate, $todate, $customer, $driver);

        if (Auth::user()->hasRole('driver')) {
            $pdf = Pdf::loadView('driverAccess.print', array_merge(compact('booking'), $ctx));
            $pdf->setPaper('A4');
        } else {
            $pdf = Pdf::loadView('admin.booking.print', array_merge(compact('booking'), $ctx));
            $pdf->setPaper([0, 0, 1883.78, 2583.94], 'landscape');
        }

        $pdf->getDomPDF()->set_option('enable_php', true);

        return $pdf->download('booking_' . Str::random(5) . '.pdf');
    }

    // ─── Detail PDF ──────────────────────────────────────────────────────────

    public function downloadDetailPdf(int $id): Response
    {
        $booking = Booking::leftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->leftJoin('user_settings', 'user_settings.user_id', '=', 'booking.user_id')
            ->leftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->leftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->leftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->select(
                'booking.*',
                'customers.customer',
                'customers.account_number as customerId',
                'user_settings.upload_logo',
                'vehicles.name as vehicleName',
                'drivers.driver as driverName',
                'drivers.driver_email',
                'drivers.driver_phone',
                'drivers_1.driver as driverName',
                'drivers_1.driver_email',
                'drivers_1.driver_phone'
            )
            ->where('job_ref', $id)
            ->first();

        $collectedOrders = CollectedOrders::where('booking_id', $id)->count()
            ? CollectedOrders::where('booking_id', $id)->get()
            : collect();

        $driver       = Drivers::where('driver_id', $booking->driver)
            ->orWhere('driver_id', $booking->second_man)->first();
        $viaAddresses = Viaaddress::where('job_ref', $id)->whereNull('deleted_at')->orderBy('via_id')->get();

        $pdf = Pdf::loadView(
            'admin.booking.print-details',
            compact('booking', 'viaAddresses', 'driver', 'collectedOrders')
        );
        $pdf->setPaper([0, 0, 620.78, 950.94], 'portrait');

        return $pdf->download('booking_' . $booking->job_ref . '.pdf');
    }

    // ─── Driver statement PDF ────────────────────────────────────────────────

    public function streamDriverPdf(
        ?int $user,
        ?string $fromdate,
        ?string $todate,
        ?int $customer,
        ?int $driver
    ): Response {
        Artisan::call('view:clear');

        $booking  = $this->queryService->get($fromdate, $todate, $user, $customer, $driver, null);
        $userId   = auth()->user()->createdFor ?? auth()->id();
        $userinfo = Usersettings::where('user_id', $userId)->first();
        $ctx      = $this->buildExportContext($fromdate, $todate, $customer, $driver);
        $driverInfo = $driver ? Drivers::where('driver_id', $driver)->first() : null;

        $pdf = Pdf::loadView(
            'admin.booking.driver',
            array_merge(compact('booking', 'userinfo', 'driverInfo'), $ctx)
        );

        return $pdf->stream('driver_statement.pdf');
    }
}