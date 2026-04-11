<?php

/*
* =======================================================================
* FILE NAME:        FuelsurchargesController.php
* DATE CREATED:  	08-08-2022
* FOR TABLE:  		fuel_surcharges
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Http\Controllers\Admin;

use App\Exports\FuelsurchargesExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\FuelsurchargesImports;
use App\Models\Fuelsurcharges;
use App\Models\System\Upload;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use PDF;
use Validator;
use Yajra\Datatables\Datatables;

class FuelsurchargesController extends Controller
{
    use Uploader;

    /**
     * FuelsurchargesController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display fuelsurcharges view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.fuelsurcharges.index');
    }

    /**
     * Load fuelsurcharges data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $fuelsurcharges = Fuelsurcharges::query();

        return Datatables::of($fuelsurcharges)
            ->addColumn('checkbox', function ($fuelsurcharges) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$fuelsurcharges->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$fuelsurcharges->id.'"> 
                <label for="box-'.$fuelsurcharges->id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($fuelsurcharges) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$fuelsurcharges->id.'" onclick="viewDetails(\''.url('admin/fuelsurcharges/details').'\','.$fuelsurcharges->id.')" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$fuelsurcharges->id.'" onclick="editForm(\''.url('admin/fuelsurcharges/edit').'\','.$fuelsurcharges->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$fuelsurcharges->id.'" onclick="deleteData(\''.url('admin/fuelsurcharges/delete').'\','.$fuelsurcharges->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    /**
     * This method select fuelsurcharges details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $fuelsurcharges = Fuelsurcharges::findOrFail($id);

        return view('admin.fuelsurcharges.details', compact('fuelsurcharges'));
    }

    /**
     * This method load fuelsurcharges form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.fuelsurcharges.create');
    }

    public function store(Request $request)
    {
        /* validate fuelsurcharges data */
        $validator = Validator::make($request->all(),
            [
                'price' => 'required',

            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            $data = [
                'price' => $request->input('price'),
                'percentage' => $request->input('percentage'),

            ];
            /* insert post data */
            $data = Fuelsurcharges::create($data);

            /* return json message */
            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select fuelsurcharges edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $fuelsurcharges = Fuelsurcharges::findOrFail($id);

        /* pass fuelsurcharges data to view and load list view */
        return view('admin.fuelsurcharges.edit', compact('fuelsurcharges'));
    }

    /**
     * This method process fuelsurcharges edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate fuelsurcharges data */
        $validator = Validator::make($request->all(),
            [
                'price' => 'required',

            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $fuelsurcharges = Fuelsurcharges::findOrFail($id);
            $fuelsurcharges->price = $request->input('price');
            $fuelsurcharges->percentage = $request->input('percentage');

            $fuelsurcharges->save();

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
            Fuelsurcharges::findOrFail($id)->delete();

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
                Fuelsurcharges::where('id', $id)->delete();
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
        $fuelsurcharges = Fuelsurcharges::all();
        $pdf = PDF::loadView('admin.fuelsurcharges.print', compact('fuelsurcharges'));

        return $pdf->download('fuelsurcharges_data.pdf');
        /* //return $pdf->stream('fuelsurcharges_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $fuelsurcharges = Fuelsurcharges::findOrFail($id);
        $pdf = PDF::loadView('admin.fuelsurcharges.print-details', compact('fuelsurcharges'));

        return $pdf->download('fuelsurcharges_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.fuelsurcharges.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('fuelsurcharges_file')) {
            $path = $request->file('fuelsurcharges_file')->getRealPath();
            Excel::import(new FuelsurchargesImports, $path);

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
        return (new FuelsurchargesExports)->download('fuelsurcharges.'.$type);
    }
}
