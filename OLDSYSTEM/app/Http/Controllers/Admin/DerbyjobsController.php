<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Archive\Derbyattributes;
use App\Models\Archive\Derbycustomer;
use App\Models\Archive\Derbyjobs;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use DB;
use Excel;
use Illuminate\Http\Request;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class DerbyjobsController extends Controller
{
    use Uploader;

    /**
     * DerbyjobsController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display derbyjobs view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        if (isset($_GET['date1'])) {
            $fromDate = Carbon::parse($_GET['date1'], config('app.timezone'))->format('Y-m-d');
            $toDate = Carbon::parse($_GET['date2'], config('app.timezone'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }
        // customer
        if (isset($_GET['customer']) and strlen($_GET['customer']) > 0) {
            $customer = $_GET['customer'];
            if ($customer > 0 and Derbycustomer::where('id', $customer)->count() > 0) {
                $customerName = Derbycustomer::where('id', $customer)->first()->name;
            } else {
                $customer = 0;
                $customerName = 0;
            }
        } else {
            $customer = 0;
            $customerName = 0;
        }
        // driver
        if (isset($_GET['driver']) and strlen($_GET['driver']) > 0) {
            $driver = $_GET['driver'];
            if ($driver > 0 and Derbycustomer::where('id', $driver)->count() > 0) {
                $driverName = Derbycustomer::where('id', $driver)->first()->name;
            } else {
                $driver = 0;
                $driverName = 0;
            }
        } else {
            $driver = 0;
            $driverName = 0;
        }

        return view('admin.derbyjobs.index', compact('fromDate', 'toDate', 'customer', 'customerName', 'driver', 'driverName'));
    }

    /**
     * Load derbyjobs data for view table
     *
     * @return mixed
     * @throws \Exception
     */
    public function getdata($fromdate = null, $todate = null, $customer = null, $driver = null)
    {
        // ->where('attributes', 'LIKE', '%' . $driver . '%')

        if ($fromdate and $customer and $driver) {
            $derbyjobs = Derbyjobs::where('customerid', '!=', 0)
                ->where('customerid', $customer)
                ->where('attributes', 'LIKE', '%'.$driver.'%')
                ->whereBetween('deldatesql', [$fromdate, $todate]);
        } elseif ($fromdate and $customer and ! $driver) {
            $derbyjobs = Derbyjobs::where('customerid', '!=', 0)
                ->where('customerid', $customer)
                ->whereBetween('deldatesql', [$fromdate, $todate]);
        } elseif ($fromdate and ! $customer and $driver) {
            $derbyjobs = Derbyjobs::where('customerid', '!=', 0)
                ->where('attributes', 'LIKE', '%'.$driver.'%')
                ->whereBetween('deldatesql', [$fromdate, $todate]);
        } elseif ($fromdate and ! $customer and ! $driver) {
            $derbyjobs = Derbyjobs::where('customerid', '!=', 0)
                ->whereBetween('deldatesql', [$fromdate, $todate]);
        } else {
            $derbyjobs = Derbyjobs::where('customerid', '!=', 0);
        }

        return Datatables::of($derbyjobs)
            ->addColumn('checkbox', function ($derbyjobs) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$derbyjobs->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$derbyjobs->id.'"> 
                <label for="box-'.$derbyjobs->id.'" class="checkinner"></label>';
            })
            ->editColumn('deldatesql', function ($derbyjobs) {
                return Carbon::parse($derbyjobs->deldatesql, config('timezone'))->format('dS M Y');
            })
            ->editColumn('customerid', function ($derbyjobs) {
                $data = Derbycustomer::where('id', $derbyjobs->customerid)->first();
                if ($data) {
                    return $data->name;
                }

            })
            ->editColumn('attributes', function ($derbyjobs) {
                $string = explode('|', $derbyjobs->attributes);
                $data = Derbyattributes::where('id', $string[3])->first();
                if ($data) {
                    return $data->name;
                }

            })
            ->editColumn('costs', function ($derbyjobs) {
                if ($derbyjobs->costs) {
                    $string = explode('|', $derbyjobs->costs);

                    return '<span style="font-weight: bold">'.config('booking.currency_symbol').number_format(($string[3]), 2).'</span>';
                }
            })
            ->addColumn('action', function ($derbyjobs) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$derbyjobs->id.'" onclick="viewDetails(\''.url('admin/derbyjobs/details').'\','.$derbyjobs->id.')" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$derbyjobs->id.'" onclick="editForm(\''.url('admin/derbyjobs/edit').'\','.$derbyjobs->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$derbyjobs->id.'" onclick="deleteData(\''.url('admin/derbyjobs/delete').'\','.$derbyjobs->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'costs'])->make(true);
    }

    /**
     * This method select derbyjobs details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $derbyjobs = Derbyjobs::findOrFail($id);

        return view('admin.derbyjobs.details', compact('derbyjobs'));
    }

    /**
     * This method load derbyjobs form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.derbyjobs.create');
    }

    public function store(Request $request)
    {
        /* validate derbyjobs data */
        $validator = Validator::make($request->all(),
            [
                'customerid' => 'required',

            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            $data = [
                'customerid' => $request->input('customerid'),
                'ref' => $request->input('ref'),
                'collidcity' => $request->input('collidcity'),
                'colltime' => $request->input('colltime'),
                'colldatesql' => $request->input('colldatesql'),
                'collnametel' => $request->input('collnametel'),
                'items' => $request->input('items'),
                'wgt' => $request->input('wgt'),
                'status' => $request->input('status'),
                'stype' => $request->input('stype'),
                'attributes' => $request->input('attributes'),
                'wr' => $request->input('wr'),
                'trafficnotes' => $request->input('trafficnotes'),
                'deliverynotes' => $request->input('deliverynotes'),
                'specialnotes' => $request->input('specialnotes'),
                'delidcity' => $request->input('delidcity'),
                'deltime' => $request->input('deltime'),
                'deldatesql' => $request->input('deldatesql'),
                'delnametel' => $request->input('delnametel'),
                'bookedby' => $request->input('bookedby'),
                'porder' => $request->input('porder'),
                'pod' => $request->input('pod'),
                'costs' => $request->input('costs'),
                'accounts' => $request->input('accounts'),
                'paperwork' => $request->input('paperwork'),
                'via1' => $request->input('via1'),
                'via2' => $request->input('via2'),
                'overide' => $request->input('overide'),
                'jobemail' => $request->input('jobemail'),
                'paid' => $request->input('paid'),
                'invoiced' => $request->input('invoiced'),
                'income' => $request->input('income'),
                'invno' => $request->input('invno'),
                'bl' => $request->input('bl'),
                'grpid' => $request->input('grpid'),

            ];
            /* insert post data */
            $data = Derbyjobs::create($data);

            /* return json message */
            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select derbyjobs edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $derbyjobs = Derbyjobs::findOrFail($id);

        /* pass derbyjobs data to view and load list view */
        return view('admin.derbyjobs.edit', compact('derbyjobs'));
    }

    /**
     * This method process derbyjobs edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate derbyjobs data */
        $validator = Validator::make($request->all(),
            [
                'customerid' => 'required',

            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $derbyjobs = Derbyjobs::findOrFail($id);
            $derbyjobs->customerid = $request->input('customerid');
            $derbyjobs->ref = $request->input('ref');
            $derbyjobs->collidcity = $request->input('collidcity');
            $derbyjobs->colltime = $request->input('colltime');
            $derbyjobs->colldatesql = $request->input('colldatesql');
            $derbyjobs->collnametel = $request->input('collnametel');
            $derbyjobs->items = $request->input('items');
            $derbyjobs->wgt = $request->input('wgt');
            $derbyjobs->status = $request->input('status');
            $derbyjobs->stype = $request->input('stype');
            $derbyjobs->attributes = $request->input('attributes');
            $derbyjobs->wr = $request->input('wr');
            $derbyjobs->trafficnotes = $request->input('trafficnotes');
            $derbyjobs->deliverynotes = $request->input('deliverynotes');
            $derbyjobs->specialnotes = $request->input('specialnotes');
            $derbyjobs->delidcity = $request->input('delidcity');
            $derbyjobs->deltime = $request->input('deltime');
            $derbyjobs->deldatesql = $request->input('deldatesql');
            $derbyjobs->delnametel = $request->input('delnametel');
            $derbyjobs->bookedby = $request->input('bookedby');
            $derbyjobs->porder = $request->input('porder');
            $derbyjobs->pod = $request->input('pod');
            $derbyjobs->costs = $request->input('costs');
            $derbyjobs->accounts = $request->input('accounts');
            $derbyjobs->paperwork = $request->input('paperwork');
            $derbyjobs->via1 = $request->input('via1');
            $derbyjobs->via2 = $request->input('via2');
            $derbyjobs->overide = $request->input('overide');
            $derbyjobs->jobemail = $request->input('jobemail');
            $derbyjobs->paid = $request->input('paid');
            $derbyjobs->invoiced = $request->input('invoiced');
            $derbyjobs->income = $request->input('income');
            $derbyjobs->invno = $request->input('invno');
            $derbyjobs->bl = $request->input('bl');
            $derbyjobs->grpid = $request->input('grpid');

            $derbyjobs->save();

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
            Derbyjobs::findOrFail($id)->delete();

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
                Derbyjobs::where('id', $id)->delete();
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
        $derbyjobs = Derbyjobs::all();
        $pdf = Pdf::loadView('admin.derbyjobs.print', compact('derbyjobs'));

        return $pdf->download('derbyjobs_data.pdf');
        /* //return $pdf->stream('derbyjobs_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $derbyjobs = Derbyjobs::findOrFail($id);
        $pdf = Pdf::loadView('admin.derbyjobs.print-details', compact('derbyjobs'));

        return $pdf->download('derbyjobs_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.derbyjobs.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('derbyjobs_file')) {
            $path = $request->file('derbyjobs_file')->getRealPath();
            $data = Excel::load($path)->get();
            if ($data->count()) {
                foreach ($data as $key => $value) {
                    $arr[] = ['customerid' => $value->customerid, 'ref' => $value->ref, 'collidcity' => $value->collidcity, 'colltime' => $value->colltime, 'colldatesql' => $value->colldatesql, 'collnametel' => $value->collnametel, 'items' => $value->items, 'wgt' => $value->wgt, 'status' => $value->status, 'stype' => $value->stype, 'attributes' => $value->attributes, 'wr' => $value->wr, 'trafficnotes' => $value->trafficnotes, 'deliverynotes' => $value->deliverynotes, 'specialnotes' => $value->specialnotes, 'delidcity' => $value->delidcity, 'deltime' => $value->deltime, 'deldatesql' => $value->deldatesql, 'delnametel' => $value->delnametel, 'bookedby' => $value->bookedby, 'porder' => $value->porder, 'pod' => $value->pod, 'costs' => $value->costs, 'accounts' => $value->accounts, 'paperwork' => $value->paperwork, 'via1' => $value->via1, 'via2' => $value->via2, 'overide' => $value->overide, 'jobemail' => $value->jobemail, 'paid' => $value->paid, 'invoiced' => $value->invoiced, 'income' => $value->income, 'invno' => $value->invno, 'bl' => $value->bl, 'grpid' => $value->grpid];
                }
                if (! empty($arr)) {
                    DB::table('derbyjobs')->insert($arr);

                    return response()->json(['success' => true, 'message' => trans('app.import.success')]);
                }
            }
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
        $derbyjobs = Derbyjobs::all('customerid', 'ref', 'collidcity', 'colltime', 'colldatesql', 'collnametel', 'items', 'wgt', 'status', 'stype', 'attributes', 'wr', 'trafficnotes', 'deliverynotes', 'specialnotes', 'delidcity', 'deltime', 'deldatesql', 'delnametel', 'bookedby', 'porder', 'pod', 'costs', 'accounts', 'paperwork', 'via1', 'via2', 'overide', 'jobemail', 'paid', 'invoiced', 'income', 'invno', 'bl', 'grpid')->toArray();

        return Excel::create('derbyjobs_data', function ($excel) use ($derbyjobs) {
            $excel->sheet('Derbyjobs Data', function ($sheet) use ($derbyjobs) {
                $sheet->fromArray($derbyjobs);
            });
        })->download($type);
    }

    public function addressAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        $queries = Derbycustomer::where('name', 'LIKE', '%'.$term.'%')
            ->orWhere('accno', 'LIKE', '%'.$term.'%')
            ->orWhere('pcode', 'LIKE', '%'.$term.'%')
            ->limit(10)->get();
        foreach ($queries as $query) {
            $results[] = ['id' => $query->id, 'value' => $query->name];
        }

        return response()->json($results);
    }

    public function driversAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        $queries = Derbyattributes::where('name', 'LIKE', '%'.$term.'%')
            ->limit(10)->get();
        foreach ($queries as $query) {
            $results[] = ['id' => $query->id, 'value' => $query->name];
        }

        return response()->json($results);
    }
}
