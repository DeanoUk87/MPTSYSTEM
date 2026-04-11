<?php


namespace App\Http\Controllers\Admin;

use App\Exports\CustomervehicleratesExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\CustomervehicleratesImports;
use App\Models\Customervehiclerates;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use DB;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class CustomervehicleratesController extends Controller
{
    use Uploader;

    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display customervehiclerates view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.customervehiclerates.index');
    }

    /**
     * Load customervehiclerates data for view table
     *
     * @return mixed
     * @throws \Exception
     */
    public function getdata()
    {
        $customervehiclerates = Customervehiclerates::query();

        return Datatables::of($customervehiclerates)
            ->addColumn('checkbox', function ($customervehiclerates) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$customervehiclerates->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$customervehiclerates->id.'"> 
                <label for="box-'.$customervehiclerates->id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($customervehiclerates) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$customervehiclerates->id.'" onclick="viewDetails(\''.url('admin/customervehiclerates/details').'\','.$customervehiclerates->id.')" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$customervehiclerates->id.'" onclick="editForm(\''.url('admin/customervehiclerates/edit').'\','.$customervehiclerates->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$customervehiclerates->id.'" onclick="deleteData(\''.url('admin/customervehiclerates/delete').'\','.$customervehiclerates->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    /**
     * This method select customervehiclerates details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $customervehiclerates = Customervehiclerates::findOrFail($id);

        return view('admin.customervehiclerates.details', compact('customervehiclerates'));
    }

    public function ratesAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('customer_vehicle_rates')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
                ->select('customers.customer', 'vehicles.name', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
                ->where('customers.customer', 'LIKE', '%'.$term.'%')
                ->orWhere('vehicles.name', 'LIKE', '%'.$term.'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('customer_vehicle_rates')
                ->LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
                ->select('customers.customer', 'vehicles.name', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
                ->where(function ($query) use ($term) {
                    $query->where('customers.customer', 'LIKE', '%'.$term.'%')
                        ->orWhere('vehicles.name', 'LIKE', '%'.$term.'%');
                })
                ->where('vehicles.user_id', $this->createdFor())
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = ['value' => $query->name.'('.$query->customer.')', 'rate_per_mile' => $query->rate_per_mile];
        }

        return response()->json($results);
    }

    /**
     * This method load customervehiclerates form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.customervehiclerates.create');
    }

    public function store(Request $request)
    {

        $rate = $request->input('vehicle_id');
        $rateWeekend = $request->input('rate_weekend');
        $customer = $request->input('customer');
        if ($rate || $rateWeekend) {
            if (count($rate) > 0) {
                $mainRate = $rate;
            } else {
                $mainRate = $rateWeekend;
            }
            foreach ($rate as $key => $value) {
                if ($value) {
                    if (Customervehiclerates::where('vehicle_id', $request->input('vehicle_id')[$key])->where('customer_id', $customer)->count() > 0) {
                        $rates = Customervehiclerates::where('vehicle_id', $request->input('vehicle_id')[$key])->where('customer_id', $customer)->first();
                        $rates->rate_per_mile = $request->input('rate')[$key];
                        $rates->rate_per_mile_weekends = $request->input('rate_weekend')[$key];
                        $rates->rate_per_mile_out_of_hours = $request->input('rate_out_of_hours')[$key] ?? null;
                        $rates->save();
                    } else {
                        Customervehiclerates::create([
                            'customer_id' => $customer,
                            'vehicle_id' => $request->input('vehicle_id')[$key],
                            'rate_per_mile' => $request->input('rate')[$key],
                            'rate_per_mile_weekends' => $request->input('rate_weekend')[$key],
                            'rate_per_mile_out_of_hours' => $request->input('rate_out_of_hours')[$key] ?? null,
                        ]);
                    }
                }
            }

            return response()->json(['success' => true, 'message' => 'Record Added Successfully']);
        } else {
            return response()->json(['error' => true, 'message' => 'Something went wrong.']);
        }

    }

    /**
     * Select customervehiclerates edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $customervehiclerates = Customervehiclerates::findOrFail($id);

        /* pass customervehiclerates data to view and load list view */
        return view('admin.customervehiclerates.edit', compact('customervehiclerates'));
    }

    /**
     * This method process customervehiclerates edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate customervehiclerates data */
        $validator = Validator::make($request->all(),
            [
                'vehicle_id' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $customervehiclerates = Customervehiclerates::findOrFail($id);
            $customervehiclerates->vehicle_id = $request->input('vehicle_id');
            $customervehiclerates->rate_per_mile = $request->input('rate_per_mile');
            $customervehiclerates->rate_per_mile_weekends = $request->input('rate_per_mile_weekends');
            $customervehiclerates->rate_per_mile_out_of_hours = $request->input('rate_per_mile_out_of_hours');
            $customervehiclerates->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success'),
            ]);
        }
    }

    /**
     * This method delete record from database
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Customervehiclerates::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * This method handle file delete from related table which were uploaded using the multiple upload option.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyFile2(Request $request, $id)
    {
        if ($request->ajax()) {
            $this->deleteFileWith($id);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Delete with checkbox
     *
     * @param  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Customervehiclerates::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
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
        $customervehiclerates = Customervehiclerates::all();
        $pdf = Pdf::loadView('admin.customervehiclerates.print', compact('customervehiclerates'));

        return $pdf->download('customervehiclerates_data.pdf');
    }

    public function exportDetailPDF($id)
    {
        $customervehiclerates = Customervehiclerates::findOrFail($id);
        $pdf = Pdf::loadView('admin.customervehiclerates.print-details', compact('customervehiclerates'));

        return $pdf->download('customervehiclerates_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.customervehiclerates.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('customervehiclerates_file')) {
            $path = $request->file('customervehiclerates_file')->getRealPath();
            Excel::import(new CustomervehicleratesImports, $path);

            return response()->json(['success' => true, 'message' => trans('app.import.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
    }

    /**
     * Export to csv and excel
     *
     * @return mixed
     */
    public function exportFile($type)
    {
        return (new CustomervehicleratesExports)->download('customervehiclerates.'.$type);
    }
}
