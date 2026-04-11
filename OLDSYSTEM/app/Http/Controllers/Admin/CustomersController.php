<?php

/*
* =======================================================================
* FILE NAME:        CustomersController.php
* DATE CREATED:  	09-01-2019
* UPDATED:  	    05-11-2020
* FOR TABLE:  		customers
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Http\Controllers\Admin;

use App\Exports\CustomersExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\CustomersImports;
use App\Models\Customers;
use App\Models\Customervehiclerates;
use App\Models\System\Upload;
use App\Models\Vehicles;
use App\User;
use Auth;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use PDF;
use Validator;
use Yajra\Datatables\Datatables;

class CustomersController extends Controller
{
    use Uploader;

    /**
     * CustomersController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display customers view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.customers.index');
    }

    /**
     * Load customers data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        // $customers = Customers::all();
        if (Auth::user()->hasRole('admin')) {
            $customers = Customers::LeftJoin('users', 'users.id', '=', 'customers.user_id')
                ->select('users.username', 'customers.*')
                ->orderBy('customer_id', 'desc');
        } else {
            $customers = Customers::LeftJoin('users', 'users.id', '=', 'customers.user_id')
                ->select('users.username', 'customers.*')
                ->orderBy('customer_id', 'desc')
                ->where('customers.user_id', $this->createdFor());
        }

        return Datatables::of($customers)
            ->addColumn('checkbox', function ($customers) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$customers->customer_id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$customers->customer_id.'"> 
                <label for="box-'.$customers->customer_id.'" class="checkinner"></label>';
            })
            ->addColumn('rates', function ($customers) {
                return '<a href="'.route('customers.details', ['id' => $customers->customer_id]).'" class="btn btn-outline-success btn-xs">Add Rates</a>';
            })
            ->addColumn('access', function ($customer) {
                if (User::where('customerId', $customer->customer_id)->count() > 0) {
                    $user = User::where('customerId', $customer->customer_id)->first();

                    return '<a href="'.route('users.edit', ['id' => $user->id, 'customer' => 1]).'" class="btn btn-success btn-xs">Can Access</a>';
                } else {
                    return '<a href="'.route('customer.signup', ['id' => $customer->customer_id]).'" class="btn btn-outline-danger btn-xs">No Access</a>';
                }
            })
            ->addColumn('action', function ($customers) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('customers.details', ['id' => $customers->customer_id]).'"  class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="'.route('customers.edit', ['id' => $customers->customer_id]).'" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$customers->customer_id.'" onclick="deleteData(\''.url('admin/customers/delete').'\','.$customers->customer_id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'rates', 'access'])->make(true);
    }

    /**
     * This method select customers details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $customervehiclerates = Customervehiclerates::where('customer_id', $id)->first();

        if (Auth::user()->hasRole('admin')) {
            $customers = Customers::LeftJoin('users', 'users.id', '=', 'customers.user_id')
                ->select('users.username', 'customers.*')
                ->where('customer_id', $id)
                ->first();
            $vehicles = Vehicles::limit('500')->get();
        } else {
            $customers = Customers::LeftJoin('users', 'users.id', '=', 'customers.user_id')
                ->select('users.username', 'customers.*')
                ->where('customer_id', $id)
                ->where('user_id', $this->createdFor())
                ->first();
            $vehicles = Vehicles::where('user_id', $this->createdFor())->limit('500')->get();
        }

        return view('admin.customers.details', compact('customers', 'vehicles', 'customervehiclerates'));
    }

    public function addressAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('customers')
                ->where(DB::raw('lower(customer)'), 'LIKE', '%'.strtolower($term).'%')
                ->orWhere(DB::raw('lower(account_number)'), 'LIKE', '%'.strtolower($term).'%')
                ->orWhere(DB::raw('lower(postcode)'), 'LIKE', '%'.strtolower($term).'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('customers')
                ->where(function ($query) use ($term) {
                    $query->where(DB::raw('lower(customer)'), 'LIKE', '%'.strtolower($term).'%')
                        ->orWhere(DB::raw('lower(account_number)'), 'LIKE', '%'.strtolower($term).'%')
                        ->orWhere(DB::raw('lower(postcode)'), 'LIKE', '%'.strtolower($term).'%');
                })
                ->where('user_id', $this->createdFor())
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = ['id' => $query->customer_id, 'value' => $query->customer, 'address' => $query->address, 'city' => $query->city, 'postcode' => $query->postcode];
        }

        return response()->json($results);
    }

    public function addressById($id)
    {
        if (Auth::user()->hasRole('admin')) {
            $customer = Customers::where('customer_id', $id)->first();
        } else {
            $customer = Customers::where('customer_id', $id)
                ->where('user_id', $this->createdFor())
                ->first();
        }

        if (! $customer) {
            return response()->json([]);
        }

        return response()->json([
            'name'     => $customer->customer,
            'address'  => $customer->address,
            'address2' => $customer->address2,
            'address3' => $customer->address3,
            'city'     => $customer->city,
            'postcode' => $customer->postcode,
            'contact'  => $customer->contact,
            'phone'    => $customer->phone,
        ]);
    }

    /**
     * This method load customers form
     *
     * @return mixed
     */
    public function insert()
    {

        $randomId = $this->randomID(6);

        return view('admin.customers.create', compact('randomId'));
    }

    public function store(Request $request)
    {
        /* validate customers data */
        $validator = Validator::make($request->all(),
            [
                'customer' => 'required',

            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } elseif ($request->input('account_number') and Customers::where('account_number', $request->input('account_number'))->count() > 0) {
            return response()->json(['error' => true, 'message' => 'Account Number '.$request->input('account_number').' Already Exist!']);
        } else {
            /* get post data */
            $data = [
                'user_id' => $this->createdFor(),
                'customer' => $request->input('customer'),
                'account_number' => $request->input('account_number'),
                'email' => $request->input('email'),
                'phone' => $request->input('phone'),
                'address' => $request->input('address'),
                'address2' => $request->input('address2'),
                'address3' => $request->input('address3'),
                'city' => $request->input('city'),
                'postcode' => $request->input('postcode'),
                'notes' => $request->input('notes'),
                'po_number' => $request->input('po_number'),
                'po_email' => $request->input('po_email'),
                'contact' => $request->input('contact'),
                'dead_mileage' => $request->input('dead_mileage'),
            ];
            /* insert post data */
            $data = Customers::create($data);
            /* return json message */
            $this->addLog('Added Customer');

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select customers edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $customers = Customers::findOrFail($id);
        $randomId = $this->randomID(6);

        /* pass customers data to view and load list view */
        return view('admin.customers.edit', compact('customers', 'randomId'));
    }

    /**
     * This method process customers edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate customers data */
        $validator = Validator::make($request->all(),
            [
                'customer' => 'required',

            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } elseif ($request->input('account_number') and Customers::where('account_number', $request->input('account_number'))->where('customer_id', '!=', $id)->count() > 0) {
            return response()->json(['error' => true, 'message' => 'Account Number '.$request->input('account_number').' Already Exist!']);
        } else {
            $customers = Customers::findOrFail($id);
            $customers->customer = $request->input('customer');
            $customers->account_number = $request->input('account_number');
            $customers->email = $request->input('email');
            $customers->phone = $request->input('phone');
            $customers->address = $request->input('address');
            $customers->address2 = $request->input('address2');
            $customers->address3 = $request->input('address3');
            $customers->city = $request->input('city');
            $customers->postcode = $request->input('postcode');
            $customers->notes = $request->input('notes');
            $customers->po_number = $request->input('po_number');
            $customers->po_email = $request->input('po_email');
            $customers->contact = $request->input('contact');
            $customers->dead_mileage = $request->input('dead_mileage');
            $customers->save();
            $this->addLog('Updated Customer');

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
            Customers::findOrFail($id)->delete();
            $this->addLog('Deleted Customer');

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
                Customers::where('customer_id', $id)->delete();
                $this->addLog('Deleted Customer');
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
        $customers = Customers::all();
        $pdf = PDF::loadView('admin.customers.print', compact('customers'));
        $pdf->setPaper([0, 0, 1883.78, 2583.94], 'A4', 'landscape');

        return $pdf->download('customers_data.pdf');
        /* //return $pdf->stream('customers_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $customers = Customers::findOrFail($id);
        $pdf = PDF::loadView('admin.customers.print-details', compact('customers'));

        return $pdf->download('customers_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.customers.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('customers_file')) {
            $path = $request->file('customers_file')->getRealPath();
            Excel::import(new CustomersImports, $path);

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
        return (new CustomersExports)->download('customers.'.$type);
    }

    /**
     * @param  $id
     *             Get Signup form for customer
     */
    public function SignUpAccess($id)
    {
        $customer = Customers::findOrFail($id);
        $username = str_replace(' ', '', substr(strtolower($customer->customer), 0, 8));
        $password = Str::random(10);

        return view('admin.customers.signup', compact('customer', 'username', 'password'));
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
                // 'email' => 'required|string|email|max:50|unique:users',
                'username' => 'required|string|max:20|unique:users',
                'password' => 'required|string',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $user = User::create([
                'username' => $request->input('username'),
                'customerId' => $request->input('customerId'),
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'email_verified_at' => $this->dateTime(),
                'password' => $request->input('password'),
                'created_for' => 1,
            ]);
            $user->assignRole('customer');

            return response()->json([
                'success' => true,
                'message' => 'Login account created successfully.<br>Username: '.$request->input('username').'<br>Password: '.$request->input('password'),
            ]);
        }
    }
}
