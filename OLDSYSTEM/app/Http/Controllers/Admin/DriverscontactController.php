<?php


namespace App\Http\Controllers\Admin;

use App\Exports\DriverscontactExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\DriverscontactImports;
use App\Models\Driverscontact;
use App\Models\System\Upload;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use PDF;
use Validator;
use Yajra\Datatables\Datatables;

class DriverscontactController extends Controller
{
    use Uploader;

    /**
     * DriverscontactController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display driverscontact view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.driverscontact.index');
    }

    /**
     * Load driverscontact data for view table
     *
     * @return mixed
     */
    public function getdata(Request $request)
    {
        $id = $request->input('id');
        $driverscontact = Driverscontact::where('driver_id', $id)->withTrashed();

        return Datatables::of($driverscontact)
            ->addColumn('checkbox', function ($driverscontact) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$driverscontact->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$driverscontact->id.'"> 
                <label for="box-'.$driverscontact->id.'" class="checkinner"></label>';
            })
            ->addColumn('access', function ($driverscontact) {
                if (User::where('dcontactId', $driverscontact->id)->count() > 0) {
                    $user = User::where('dcontactId', $driverscontact->id)->first();

                    return '<a href="'.route('users.edit', ['id' => $user->id, 'driver' => 1]).'" class="btn btn-success btn-xs">Can Access</a>';
                } else {
                    return '<a href="'.route('driverscontact.signup', ['id' => $driverscontact->id]).'" class="btn btn-outline-danger btn-xs">No Access</a>';
                }
            })
            ->editColumn('deleted_at', function ($driverscontact) {
                if ($driverscontact->deleted_at) {
                    return '<a href="'.route('driverscontact.status', ['id' => $driverscontact->id, 'status' => 0]).'" class="btn btn-danger btn-xs">Hidden</a>';
                } else {
                    return '<a href="'.route('driverscontact.status', ['id' => $driverscontact->id, 'status' => 1]).'" class="btn btn-success btn-xs">Visible</a>';
                }
            })
            ->addColumn('action', function ($driverscontact) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$driverscontact->id.'" onclick="editForm(\''.url('admin/driverscontact/edit').'\','.$driverscontact->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$driverscontact->id.'" onclick="deleteData(\''.url('admin/driverscontact/delete').'\','.$driverscontact->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'access', 'deleted_at'])->make(true);
    }

    /**
     * This method select driverscontact details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $driverscontact = Driverscontact::findOrFail($id);

        return view('admin.driverscontact.details', compact('driverscontact'));
    }

    /**
     * This method load driverscontact form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.driverscontact.create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'driver_id' => 'required',
                'driver_name' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $data = [
                'driver_id' => $request->input('driver_id'),
                'driver_name' => $request->input('driver_name'),
                'vehicle_make' => $request->input('vehicle_make'),
                'vehicle_registeration' => $request->input('vehicle_registeration'),
                'driver_phone' => $request->input('driver_phone'),
            ];
            Driverscontact::create($data);
            $this->addLog('Added Driver Contact');

            return back()->with('success', trans('app.add.success'));
            // return response()->json(['success' => true,'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select driverscontact edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {
        $driverscontact = Driverscontact::findOrFail($id);

        return view('admin.driverscontact.edit', compact('driverscontact'));
    }

    /**
     * This method process driverscontact edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate driverscontact data */
        $validator = Validator::make($request->all(),
            [
                'driver_name' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $driverscontact = Driverscontact::findOrFail($id);
            $driverscontact->driver_name = $request->input('driver_name');
            $driverscontact->vehicle_make = $request->input('vehicle_make');
            $driverscontact->vehicle_registeration = $request->input('vehicle_registeration');
            $driverscontact->driver_phone = $request->input('driver_phone');
            $driverscontact->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success')]);
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
            Driverscontact::findOrFail($id)->delete();

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
                Driverscontact::where('id', $id)->delete();
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
        $driverscontact = Driverscontact::all();
        $pdf = PDF::loadView('admin.driverscontact.print', compact('driverscontact'));

        return $pdf->download('driverscontact_data.pdf');
        /* //return $pdf->stream('driverscontact_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $driverscontact = Driverscontact::findOrFail($id);
        $pdf = PDF::loadView('admin.driverscontact.print-details', compact('driverscontact'));

        return $pdf->download('driverscontact_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.driverscontact.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('driverscontact_file')) {
            $path = $request->file('driverscontact_file')->getRealPath();
            Excel::import(new DriverscontactImports, $path);

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
        return (new DriverscontactExports)->download('driverscontact.'.$type);
    }

    /**
     * @param  $id
     *             Get Signup form for drivers
     */
    public function SignUpAccess($id)
    {
        $drivers = Driverscontact::findOrFail($id);
        $username = str_replace(' ', '', substr(strtolower($drivers->driver_name), 0, 8));
        $email = str_replace(' ', '', strtolower($drivers->driver_name)).'@gmail.com';
        $password = Str::random(10);

        return view('admin.driverscontact.signup', compact('drivers', 'username', 'password', 'email'));
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
            $user = new User;
            $user->username = $request->input('username');
            $user->dcontactId = (int) $request->input('dcontactId');
            $user->name = $request->input('name');
            $user->email = $request->input('email');
            $user->email_verified_at = $this->dateTime();
            $user->password = $request->input('password');
            $user->created_for = 1;
            $user->save();

            $user->assignRole('dcontact');

            return response()->json([
                'success' => true,
                'message' => 'Login account created successfully.<br>Username: '.$request->input('username').'<br>Password: '.$request->input('password'),
            ]);
        }
    }

    /**
     * @return \Illuminate\Http\RedirectResponse
     */
    public function changeVisibility($id, $status)
    {
        $driver = Driverscontact::where('id', $id);
        if ($status) {
            $driver->delete();
        } else {
            $driver->withTrashed()->restore();
        }

        return redirect()->back()->with('success','Contact status updated successfully');
    }
}
