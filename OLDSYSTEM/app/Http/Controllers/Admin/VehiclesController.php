<?php

namespace App\Http\Controllers\Admin;

use App\Exports\VehiclesExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\VehiclesImports;
use App\Models\Booking;
use App\Models\Vehicles;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use DB;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class VehiclesController extends Controller
{
    use Uploader;

    /**
     * VehiclesController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display vehicles view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.vehicles.index');
    }

    /**
     * Load vehicles data for view table
     *
     * @return mixed
     * @throws \Exception
     */
    public function getdata()
    {
        if (Auth::user()->hasRole('admin')) {
            $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
                ->select('users.username', 'vehicles.*')
                ->orderBy('id', 'desc');
        } else {
            $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
                ->select('users.username', 'vehicles.*')
                ->where('vehicles.user_id', $this->createdFor())
                ->orderBy('id', 'desc');
        }

        return Datatables::of($vehicles)
            ->addColumn('checkbox', function ($vehicles) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$vehicles->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$vehicles->id.'"> 
                <label for="box-'.$vehicles->id.'" class="checkinner"></label>';
            })
            ->editColumn('jobs', function ($vehicles) {
                return '<a href="'.route('booking.index', ['user' => 0, 'vehicle' => $vehicles->id]).'" class="btn btn-outline-info btn-xs">'.
                    Booking::where('vehicle', $vehicles->id)->count().'</a>';
            })
            ->addColumn('action', function ($vehicles) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('vehicles.edit', ['id' => $vehicles->id]).'"  class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$vehicles->id.'" onclick="deleteData(\''.url('admin/vehicles/delete').'\','.$vehicles->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'jobs'])->make(true);
    }

    /**
     * This method select vehicles details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
            ->select('users.username', 'vehicles.*')
            ->where('vehicles.id', $id)
            ->first();

        return view('admin.vehicles.details', compact('vehicles'));
    }

    public function vehiclesAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('vehicles')
                ->where('name', 'LIKE', '%'.$term.'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('vehicles')
                ->where('name', 'LIKE', '%'.$term.'%')
                ->where('user_id', $this->createdFor())
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = ['id' => $query->id, 'value' => $query->name];
        }

        return response()->json($results);
    }

    /**
     * This method load vehicles form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.vehicles.create');
    }

    public function store(Request $request)
    {
        /* validate vehicles data */
        $validator = Validator::make($request->all(),
            [
                'name' => 'required',
            ],
            [
                'name.required' => 'Please enter the vehicle name',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            $data = [
                'name' => $request->input('name'),
                'user_id' => $this->createdFor(),
                'cost_per_mile' => $request->input('cost_per_mile'),
                'driver_id' => $request->input('driver_id'),
            ];
            /* insert post data */
            $data = Vehicles::create($data);
            $this->addLog('Added Vehicle');

            /* return json message */
            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select vehicles edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {
        $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
            ->select('users.username', 'vehicles.*')
            ->where('vehicles.id', $id)
            ->first();

        return view('admin.vehicles.edit', compact('vehicles'));
    }

    /**
     * This method process vehicles edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate vehicles data */
        $validator = Validator::make($request->all(),
            [
                'name' => 'required',
            ],
            [
                'name.required' => 'Please enter the vehicle name',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $vehicles = Vehicles::findOrFail($id);
            $vehicles->name = $request->input('name');
            $vehicles->cost_per_mile = $request->input('cost_per_mile');
            $vehicles->driver_id = $request->input('driver_id');
            $vehicles->save();
            $this->addLog('Updated Vehicle');

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
            Vehicles::findOrFail($id)->delete();
            $this->addLog('Deleted Vehicle');

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
                Vehicles::where('id', $id)->delete();
                $this->addLog('Deleted Vehicle');
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
        // $vehicles = Vehicles::all();
        if (Auth::user()->hasRole('admin')) {
            $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
                ->select('users.username', 'vehicles.*')
                ->orderBy('id', 'desc')
                ->get();
        } else {
            $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
                ->select('users.username', 'vehicles.*')
                ->where('vehicles.user_id', $this->createdFor())
                ->orderBy('id', 'desc')
                ->get();
        }
        $pdf = Pdf::loadView('admin.vehicles.print', compact('vehicles'));

        return $pdf->download('vehicles_data.pdf');
    }

    public function exportDetailPDF($id)
    {
        $vehicles = Vehicles::LeftJoin('users', 'users.id', '=', 'vehicles.user_id')
            ->select('users.username', 'vehicles.*')
            ->where('vehicles.id', $id)
            ->first();
        $pdf = Pdf::loadView('admin.vehicles.print-details', compact('vehicles'));

        return $pdf->download('vehicles_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.vehicles.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('vehicles_file')) {
            $path = $request->file('vehicles_file')->getRealPath();
            Excel::import(new VehiclesImports, $path);

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
        return (new VehiclesExports)->download('vehicles.'.$type);
    }
}
