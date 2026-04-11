<?php


namespace App\Http\Controllers\Admin;

use App\Exports\DriversExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\DriversImports;
use App\Models\Booking;
use App\Models\Drivers;
use App\User;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class DriversController extends Controller
{
    use Uploader;

    /**
     * DriversController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display drivers view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.drivers.index');
    }

    /**
     * Load drivers data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        if (Auth::user()->hasRole('admin')) {
            $drivers = Drivers::LeftJoin('users', 'users.id', '=', 'drivers.user_id')
                ->select('users.username', 'drivers.*')
                ->orderBy('drivers.driver', 'asc');
        } else {
            $drivers = Drivers::LeftJoin('users', 'users.id', '=', 'drivers.user_id')
                ->select('users.username', 'drivers.*')
                ->where('drivers.user_id', $this->createdFor())
                ->orderBy('drivers.driver', 'asc');
        }

        return Datatables::of($drivers)
            ->addColumn('checkbox', function ($drivers) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$drivers->driver_id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$drivers->driver_id.'"> 
                <label for="box-'.$drivers->driver_id.'" class="checkinner"></label>';
            })
            ->addColumn('jobs', function ($drivers) {
                return '<a href="'.route('booking.index', ['user' => 0, 'driver' => $drivers->driver_id]).'" class="btn btn-outline-info btn-xs">'.
                    Booking::where('driver', $drivers->driver_id)->orWhere('second_man', $drivers->driver_id)->count().'</a>';
            })
            ->addColumn('access', function ($drivers) {
                if (User::where('driverId', $drivers->driver_id)->count() > 0) {
                    $user = User::where('driverId', $drivers->driver_id)->first();

                    return '<a href="'.route('users.edit', ['id' => $user->id, 'driver' => 1]).'" class="btn btn-success btn-xs">Can Access</a>';
                } else {
                    return '<a href="'.route('driver.signup', ['id' => $drivers->driver_id]).'" class="btn btn-outline-danger btn-xs">No Access</a>';
                }
            })
            ->addColumn('action', function ($drivers) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('drivers.details', ['id' => $drivers->driver_id]).'" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$drivers->driver_id.'" onclick="editForm(\''.url('admin/drivers/edit').'\','.$drivers->driver_id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$drivers->driver_id.'" onclick="deleteData(\''.url('admin/drivers/delete').'\','.$drivers->driver_id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'jobs', 'access'])->make(true);
    }

    /**
     * This method select drivers details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $drivers = Drivers::findOrFail($id);

        return view('admin.drivers.details', compact('drivers'));
    }

    public function driversAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('drivers')
                ->where('driver', 'LIKE', '%'.$term.'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('drivers')
                ->where('driver', 'LIKE', '%'.$term.'%')
                ->where('user_id', $this->createdFor())
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = ['id' => $query->driver_id, 'value' => $query->driver];
        }

        return response()->json($results);
    }

    /**
     * This method load drivers form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.drivers.create');
    }

    public function store(Request $request)
    {
        /* validate drivers data */
        $driverCheck = Drivers::where('driver_type', $request->input('driver_type'))
            ->where('driver', $request->input('driver'))
            ->count();
        $validator = Validator::make($request->all(),
            [
                'driver_type' => 'required',
                'driver' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } elseif ($driverCheck > 0) {
            return response()->json(['error' => true, 'message' => 'Invalid: Duplicate Record']);
        } else {
            /* get post data */
            $data = [
                'user_id' => $this->createdFor(),
                'driver_type' => $request->input('driver_type'),
                'driver' => $request->input('driver'),
                'cost_per_mile' => $request->input('cost_per_mile'),
                'cost_per_mile_weekends' => $request->input('cost_per_mile_weekends'),
                'cost_per_mile_out_of_hours' => $request->input('cost_per_mile_out_of_hours'),
                'driver_email' => $request->input('driver_email'),
                'driver_phone' => $request->input('driver_phone'),
                'driver_address' => $request->input('driver_address'),
                'driver_others' => $request->input('driver_others'),
            ];
            /* insert post data */
            $data = Drivers::create($data);
            $this->addLog('Added Driver');

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select drivers edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $drivers = Drivers::findOrFail($id);

        return view('admin.drivers.edit', compact('drivers'));
    }

    /**
     * This method process drivers edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate drivers data */
        $validator = Validator::make($request->all(),
            [
                'driver_type' => 'required',
                'driver' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $drivers = Drivers::findOrFail($id);
            $drivers->driver_type = $request->input('driver_type');
            $drivers->driver = $request->input('driver');
            $drivers->cost_per_mile = $request->input('cost_per_mile');
            $drivers->cost_per_mile_weekends = $request->input('cost_per_mile_weekends');
            $drivers->cost_per_mile_out_of_hours = $request->input('cost_per_mile_out_of_hours');
            $drivers->driver_email = $request->input('driver_email');
            $drivers->driver_phone = $request->input('driver_phone');
            $drivers->driver_address = $request->input('driver_address');
            $drivers->driver_others = $request->input('driver_others');
            $drivers->save();
            $this->addLog('Updated Driver');

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
            Drivers::findOrFail($id)->delete();
            $this->addLog('Deleted Driver');

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
     * @param Request $request
     * @return JsonResponse
     */
    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Drivers::where('driver_id', $id)->delete();
                $this->addLog('Deleted Driver');
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
        $drivers = Drivers::all();
        $pdf = Pdf::loadView('admin.drivers.print', compact('drivers'));

        return $pdf->download('drivers_data.pdf');
        /* //return $pdf->stream('drivers_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $drivers = Drivers::findOrFail($id);
        $pdf = Pdf::loadView('admin.drivers.print-details', compact('drivers'));

        return $pdf->download('drivers_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.drivers.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('drivers_file')) {
            $path = $request->file('drivers_file')->getRealPath();
            Excel::import(new DriversImports, $path);

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
        return (new DriversExports)->download('drivers.'.$type);
    }

    /**
     * @param  $id
     *             Get Signup form for drivers
     */
    public function SignUpAccess($id)
    {
        $drivers = Drivers::findOrFail($id);
        $username = str_replace(' ', '', substr(strtolower($drivers->driver), 0, 8));
        $password = Str::random(10);

        return view('admin.drivers.signup', compact('drivers', 'username', 'password'));
    }

    /**
     * Create Driver access on users table
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function SignUpAccessPro(Request $request)
    {
        /* validate customers data */
        $validator = Validator::make($request->all(),
            [
                'username' => 'required|string|max:20|unique:users',
                'password' => 'required|string',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $user = User::create([
                'username' => $request->input('username'),
                'driverId' => $request->input('driverId'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'email_verified_at' => $this->dateTime(),
                'password' => $request->input('password'), // bcrypt($request->input('password'))
                'created_for' => 1,
            ]);
            $user->assignRole('driver');

            return response()->json([
                'success' => true,
                'message' => 'Login account created successfully.<br>Username: '.$request->input('username').'<br>Password: '.$request->input('password'),
            ]);
        }
    }
}
