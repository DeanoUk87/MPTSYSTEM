<?php

namespace App\Services\Booking;

use App\Models\Viaaddress;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Yajra\DataTables\Facades\DataTables;

class BookingDatatableService
{
    /**
     * Build the full DataTables JSON response for the bookings list.
     */
    public function make(mixed $query): JsonResponse
    {
        return DataTables::of($query)
            ->addColumn('checkbox', fn ($b) => $this->renderCheckbox($b))
            ->setRowAttr(['style' => fn ($b) => $this->rowStyle($b)])
            ->editColumn('job_ref',        fn ($b) => $this->renderJobRef($b))
            ->editColumn('created_at',     fn ($b) => $b->created_at     ? Carbon::parse($b->created_at,     config('timezone'))->format('d/m/Y') : '')
            ->editColumn('collection_date', fn ($b) => $b->collection_date ? Carbon::parse($b->collection_date, config('timezone'))->format('d/m/Y') : '')
            ->editColumn('collection_time', fn ($b) => $b->collection_time ? substr($b->collection_time, 0, -3) : '')
            ->editColumn('delivery_date',   fn ($b) => $b->delivery_date   ? Carbon::parse($b->delivery_date,   config('timezone'))->format('d/m/Y') : '')
            ->addColumn('from',         fn ($b) => $b->collection_postcode ?? '')
            ->addColumn('to',           fn ($b) => $b->delivery_postcode   ?? '')
            ->addColumn('via1',         fn ($b) => $this->renderVia($b, 0))
            ->addColumn('via2',         fn ($b) => $this->renderVia($b, 1))
            ->addColumn('via3',         fn ($b) => $this->renderVia($b, 2))
            ->addColumn('via4',         fn ($b) => $this->renderVia($b, 3))
            ->addColumn('via5',         fn ($b) => $this->renderVia($b, 4))
            ->addColumn('via6',         fn ($b) => $this->renderVia($b, 5))
            ->editColumn('cost',        fn ($b) => $b->cost ? config('booking.currency_symbol') . number_format(($b->cost + $b->extra_cost2), 2) : '')
            ->addColumn('driverSum',    fn ($b) => ($b->driver_cost || $b->extra_cost || $b->cxdriver_cost)
                ? number_format(($b->driver_cost + $b->extra_cost + $b->cxdriver_cost), 2) : '')
            ->addColumn('driverName',   fn ($b) => $this->renderDriverName($b))
            ->editColumn('invoice_number', fn ($b) => $b->invoice_number
                ? '<a href="#" class="btn btn-outline-dark btn-xs">' . $b->invoice_number . '</a>' : '')
            ->editColumn('job_status',  fn ($b) => $this->renderJobStatus($b))
            ->editColumn('locker',      fn ($b) => $this->renderLocker($b))
            ->addColumn('action',       fn ($b) => $this->renderActions($b))
            ->filterColumn('customerName', fn ($q, $k) => $q->whereRaw('customers.customer like ?', ["%{$k}%"]))
            ->filterColumn('driverName',   fn ($q, $k) => $q->whereRaw('drivers.driver like ?',    ["%{$k}%"]))
            ->filterColumn('secondMan',    fn ($q, $k) => $q->whereRaw('drivers.driver like ?',    ["%{$k}%"]))
            ->filterColumn('cxdriverName', fn ($q, $k) => $q->whereRaw('drivers.driver like ?',    ["%{$k}%"]))
            ->filterColumn('vehicleName',  fn ($q, $k) => $q->whereRaw('vehicles.name like ?',     ["%{$k}%"]))
            ->filterColumn('from',         fn ($q, $k) => $q->whereRaw('booking.collection_postcode like ?', ["%{$k}%"]))
            ->filterColumn('to',           fn ($q, $k) => $q->whereRaw('booking.delivery_postcode like ?',   ["%{$k}%"]))
            ->rawColumns(['checkbox', 'action', 'cost', 'invoice_number', 'job_ref', 'job_status', 'driverName', 'via1', 'via2', 'via3', 'via4', 'via5', 'via6', 'locker'])
            ->make(true);
    }

    // ─── Row styles ──────────────────────────────────────────────────────────

    private function rowStyle($booking): string
    {
        $viasTotal  = Viaaddress::where('job_ref', $booking->job_ref)->whereNull('deleted_at')->count();
        $viasSigned = Viaaddress::where('job_ref', $booking->job_ref)
            ->where(fn ($q) => $q->where('signed_by', '!=', '')->orWhereNotNull('signed_by'))
            ->whereNull('deleted_at')->count();

        if ($booking->booking_type === 'Quote') return 'background-color: #e0e0e0;';
        if ($booking->pod == 1)                  return 'background-color: #bbdefb;';

        $hasDriver = $booking->driver || $booking->second_man || $booking->cxdriver;
        $hasPod    = strlen($booking->pod_signature ?? '') > 1 && strlen($booking->pod_time ?? '') > 1;

        if ($hasDriver && ! $hasPod && $booking->job_status === 0) return 'background-color: #fde43a;';

        if ($hasDriver && $hasPod && $booking->pod_data_verify) {
            return $viasTotal === $viasSigned
                ? 'background-color: #b9f6ca;'
                : 'background-color: #fde43a;';
        }

        if (! $hasDriver) return 'background-color: #ffcdd2;';

        return '';
    }

    // ─── Column renderers ────────────────────────────────────────────────────

    private function renderCheckbox($b): string
    {
        return '<input type="checkbox" name="checkbox[]" id="box-' . $b->job_ref . '" class="check-style filled-in blue" onclick="toggleBtn()" value="' . $b->job_ref . '">
                <label for="box-' . $b->job_ref . '" class="checkinner"></label>';
    }

    private function renderJobRef($b): string
    {
        if (Auth::user()->hasRole('driver')) {
            return '<a href="' . route('booking.details', ['id' => $b->job_ref, 'driver' => 1]) . '" class="btn btn-outline-success btn-xs">' . $b->customerId . '-' . $b->job_ref . '';
        }

        $vias = Viaaddress::where('job_ref', $b->job_ref)->whereNull('deleted_at')->count();
        $note = $b->job_notes ? '<i class="fa fa-comment fa-2x text-primary"></i>' : '';
        $link = route('booking.edit', ['id' => $b->job_ref, 'cust' => $b->customer, 'edit' => 1]);

        if ($vias > 0) {
            return '<a href="' . $link . '" class="btn btn-outline-success btn-xs">' . $b->customerId . '-' . $b->job_ref . '</a>'
                . '<a href="#" class="btn btn-danger btn-xs" title="' . $vias . ' Via Address">' . $vias . '</a> ' . $note;
        }

        return '<a href="' . $link . '" class="btn btn-outline-success btn-xs">' . $b->customerId . '-' . $b->job_ref . ' ' . $note;
    }

    private function renderVia($b, int $index): string
    {
        $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')
            ->where('job_ref', $b->job_ref)->whereNull('deleted_at');

        if ($via->count() === 0) return '';

        $postcodes = $via->pluck('postcode');
        $signed    = $via->pluck('signed_by');
        $verify    = $via->pluck('via_pod_data_verify');
        $mobile    = $via->pluck('via_pod_mobile');

        if (! isset($postcodes[$index])) return '';

        $postcode = $postcodes[$index];

        if ($signed[$index] && $b->pod !== 1 && $verify[$index]) {
            return '<span style="background-color: #b9f6ca; padding: 6px;">' . $postcode . '</span>';
        }

        if ($mobile[$index]) {
            return '<span style="background-color: #ffcdd2; padding: 6px;">' . $postcode . '</span>';
        }

        return $postcode;
    }

    private function renderDriverName($b): string
    {
        $driver = '';
        if ($b->driverName && ! $b->secondMan)  $driver .= $b->driverName;
        if ($b->secondMan  && ! $b->driverName) $driver .= $b->secondMan;
        if ($b->secondMan  && $b->driverName)   $driver .= $b->driverName . ' <br>' . $b->secondMan;
        return $driver . '' . $b->cxdriverName;
    }

    private function renderJobStatus($b): string
    {
        if ($b->booking_type === 'Quote') {
            return '<a href="javascript:viod(0)" class="btn btn-default btn-xs">Quote</a>';
        }

        $hasDriver = $b->driver || $b->secondMan || $b->cxdriver;
        $hasPod    = strlen($b->pod_signature ?? '') > 1 && strlen($b->pod_time ?? '') > 1;

        if ($hasDriver && $hasPod && $b->job_status == 0) {
            $profit = ($b->cost + $b->extra_cost2 - $b->driver_cost - $b->extra_cost - $b->cxdriver_cost);
            return $profit > 0
                ? '<a href="' . route('booking.jobstatus', ['id' => $b->job_ref, 'status' => 1]) . '" class="btn btn-success btn-xs" onclick="return confirm(\'You are send this job to account?\')">Send To Acc</a>'
                : '<a href="javascript:viod(0)" class="btn btn-danger btn-xs">Negative</a>';
        }

        if ($hasDriver && $hasPod && $b->job_status === 1) {
            return '<a href="#" class="btn btn-success btn-xs">Completed</a>';
        }

        if (! $hasDriver) {
            return '<a href="javascript:viod(0)" class="btn btn-danger btn-xs">Driver Required</a>';
        }

        if ($hasDriver && $b->job_status === 0 && strlen($b->pod_signature ?? '') < 1) {
            return '<a href="javascript:viod(0)" class="btn btn-outline-warning btn-xs">Processing</a>';
        }

        return '';
    }

    private function renderLocker($b): string
    {
        if ($b->locker == 1) {
            return '<a href="' . route('booking.locker', ['id' => $b->job_ref]) . '" class="btn btn-outline-danger btn-xs" onclick="return confirm(\'Allow mobile view\')">Locked</a>';
        }
        return '<a href="' . route('booking.locker', ['id' => $b->job_ref]) . '" class="btn btn-outline-success btn-xs" onclick="return confirm(\'Prevent mobile view\')">Opened</a>';
    }

    private function renderActions($b): string
    {
        return '
        <div class="btn-group btn-group-xs" role="group">
            <a href="' . route('booking.details', ['id' => $b->job_ref]) . '" class="btn btn-info btn-xs" title="Email Job"><i class="fa fa-send-o"></i></a>
            <a href="' . route('booking.edit', ['id' => $b->job_ref, 'cust' => $b->customer, 'edit' => 1]) . '" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a>
            <a href="javascript:viod(0)" data-id="row-' . $b->job_ref . '" onclick="deleteData(\'' . url('admin/booking/delete') . '\',' . $b->job_ref . ')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a>
            <a href="' . route('booking.pod', ['id' => $b->job_ref]) . '" class="btn btn-secondary btn-xs" data-toggle="tooltip" title="Received POD" onclick="return confirm(\'Are you sure you want to change POD status?\')"><i class="fa fa-book"></i></a>
        </div>';
    }
}