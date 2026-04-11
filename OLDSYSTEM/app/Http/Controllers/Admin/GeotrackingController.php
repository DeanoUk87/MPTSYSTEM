<?php

/*
* =======================================================================
* FILE NAME:        GeotrackingController.php
* DATE CREATED:  	14-07-2021
* FOR TABLE:  		geo_tracking
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Http\Controllers\Admin;

use App\Exports\GeotrackingExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Geotracking;
use App\Models\Geotrackingdetails;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use PDF;
use Yajra\Datatables\Datatables;

class GeotrackingController extends Controller
{
    use Uploader;

    /**
     * GeotrackingController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display geotracking view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        if (isset($_GET['date1'])) {
            $fromDate = Carbon::parse($_GET['date1'], env('TIME_ZONE'))->format('Y-m-d');
            $toDate = Carbon::parse($_GET['date2'], env('TIME_ZONE'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }

        return view('admin.geotracking.index', compact('fromDate', 'toDate'));
    }

    /**
     * Load geotracking data for view table
     *
     * @return mixed
     */
    public function getdata(Request $request)
    {
        if ($request->input('fromdate')) {
            $fromDate = Carbon::parse($request->input('fromdate'))->format('Y-m-d');
            $toDate = Carbon::parse($request->input('todate'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }
        $geotracking = DB::table('geo_tracking')
            ->join('drivers', 'geo_tracking.driver_id', '=', 'drivers.driver_id')
            ->select('drivers.driver', 'geo_tracking.*')
            ->where(function ($query) use ($fromDate, $toDate) {
                if ($fromDate) {
                    $query->whereBetween('started_at', [$fromDate, $toDate]);
                }
            })
            ->get();

        return Datatables::of($geotracking)
            ->editColumn('status', function ($geotracking) {
                if ($geotracking->status == 1) {
                    return '<a href="javascript:viod(0)" class="btn btn-success btn-xs">In transit</a>';
                } elseif ($geotracking->status == 2) {
                    return '<a href="javascript:viod(0)" class="btn btn-primary btn-xs">Delivered</a>';
                } else {
                    return '<a href="javascript:viod(0)" class="btn btn-danger btn-xs">Pending</a>';
                }
            })
            ->editColumn('started_at', function ($geotracking) {
                if ($geotracking->started_at) {
                    return Carbon::parse($geotracking->started_at, config('timezone'))->diffForHumans().' @'.Carbon::parse($geotracking->started_at, config('timezone'))->format('h:ia');
                }
            })
            ->editColumn('current_date', function ($geotracking) {
                if ($geotracking->current_date) {
                    return Carbon::parse($geotracking->current_date, config('timezone'))->diffForHumans();
                }
            })
            ->editColumn('ended_at', function ($geotracking) {
                if ($geotracking->ended_at) {
                    return Carbon::parse($geotracking->ended_at, config('timezone'))->diffForHumans().' @'.Carbon::parse($geotracking->ended_at, config('timezone'))->format('h:ia');
                }
            })
            ->addColumn('action', function ($geotracking) {
                if ($geotracking->status == 1) {
                    $label = 'Track';
                } else {
                    $label = 'View';
                }

                return '
           <div class="btn-group" role="group" aria-label="actions"> 
           <a href="'.route('geotracking.details', $geotracking->id).'"  class="btn btn-dark btn-xs">'.$label.'</a> 
           <a href="javascript:viod(0)" data-id="row-'.$geotracking->id.'" onclick="deleteData(\''.url('admin/geotracking/delete').'\','.$geotracking->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['action', 'status'])->make(true);
    }

    /**
     * This method select geotracking details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $geotracking = DB::table('geo_tracking')
            ->leftJoin('drivers', 'geo_tracking.driver_id', '=', 'drivers.driver_id')
            ->leftJoin('booking', 'geo_tracking.job_id', '=', 'booking.job_ref')
            ->select('drivers.driver', 'geo_tracking.*', 'booking.delivery_lat', 'booking.delivery_lng',
                'booking.collection_address1', 'booking.collection_address2', 'booking.collection_area', 'booking.collection_country', 'booking.collection_postcode',
                'booking.delivery_address1', 'booking.delivery_address2', 'booking.delivery_area', 'booking.delivery_country', 'booking.delivery_postcode'
            )
            ->where('geo_tracking.id', '=', $id)->get()->first();
        $finalDelivery = $this->latLngGeocode($geotracking->job_id, 'final');
        $currentAddress = $this->latLngGeocode($geotracking->job_id, 'current');
        $tracking = $this->getTrackingDetails($geotracking->id);
        $history = Geotrackingdetails::where('geo_id', $geotracking->id)->select('latitude', 'longitude', 'address')->orderBy('id')->limit(500)->distinct()->groupBy('latitude')->get();
        $collection = $geotracking->collection_address1.' '.$geotracking->collection_address2.' '.$geotracking->collection_area.' '.$geotracking->collection_country.' '.$geotracking->collection_postcode;
        $delivery = $geotracking->delivery_address1.' '.$geotracking->delivery_address2.' '.$geotracking->delivery_area.' '.$geotracking->delivery_country.' '.$geotracking->delivery_postcode;

        return view('admin.geotracking.details', compact('geotracking', 'collection', 'delivery', 'tracking', 'finalDelivery', 'currentAddress', 'history'));
    }

    /**
     * This method delete record from database
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Geotracking::findOrFail($id)->delete();
            Geotrackingdetails::where('geo_id', $id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Export to PDF
     *
     * @return mixed
     */
    public function exportPDF(Request $request)
    {
        $geotracking = Geotracking::all();
        $pdf = PDF::loadView('admin.geotracking.print', compact('geotracking'));

        return $pdf->download('geotracking_data.pdf');
        /* //return $pdf->stream('geotracking_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $geotracking = DB::table('geo_tracking')
            ->join('drivers', 'geo_tracking.driver_id', '=', 'drivers.driver_id')
            ->join('users', 'geo_tracking.user_id', '=', 'users.id')
            ->where('geo_tracking.id', '=', $id)->get()->first();
        $pdf = PDF::loadView('admin.geotracking.print-details', compact('geotracking'));

        return $pdf->download('geotracking_data_details.pdf');
    }

    /**
     * Export to csv and excel
     *
     * @return mixed
     */
    public function exportFile($type)
    {
        return (new GeotrackingExports)->download('geotracking.'.$type);
    }
}
