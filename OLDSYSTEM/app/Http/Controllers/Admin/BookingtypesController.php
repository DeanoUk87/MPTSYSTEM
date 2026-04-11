<?php

/*
* =======================================================================
* FILE NAME:        BookingtypesController.php
* DATE CREATED:  	19-03-2019
* FOR TABLE:  		booking_types
* AUTHOR:			Hezecom Technology Solutions LTD.
* CONTACT:			http://hezecom.com <info@hezecom.com>
* =======================================================================
*/

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Bookingtypes;
use Excel;
use Illuminate\Http\Request;
use PDF;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class BookingtypesController extends Controller
{
    use Uploader;

    /**
     * BookingtypesController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display bookingtypes view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.bookingtypes.index');
    }

    /**
     * Load bookingtypes data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $bookingtypes = Bookingtypes::query();

        return Datatables::of($bookingtypes)
            ->addColumn('checkbox', function ($bookingtypes) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$bookingtypes->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$bookingtypes->id.'"> 
                <label for="box-'.$bookingtypes->id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($bookingtypes) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$bookingtypes->id.'" onclick="editForm(\''.url('admin/bookingtypes/edit').'\','.$bookingtypes->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$bookingtypes->id.'" onclick="deleteData(\''.url('admin/bookingtypes/delete').'\','.$bookingtypes->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    /**
     * This method select bookingtypes details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $bookingtypes = Bookingtypes::findOrFail($id);

        return view('admin.bookingtypes.details', compact('bookingtypes'));
    }

    /**
     * This method load bookingtypes form
     *
     * @return mixed
     */
    public function insert()
    {

        return view('admin.bookingtypes.create');
    }

    public function store(Request $request)
    {
        /* validate bookingtypes data */
        $validator = Validator::make($request->all(),
            [
                'type_name' => 'required',

            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            $data = $request->all();
            /* insert post data */
            $data = Bookingtypes::create($data);

            /* return json message */
            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select bookingtypes edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {

        $bookingtypes = Bookingtypes::findOrFail($id);

        /* pass bookingtypes data to view and load list view */
        return view('admin.bookingtypes.edit', compact('bookingtypes'));
    }

    /**
     * This method process bookingtypes edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate bookingtypes data */
        $validator = Validator::make($request->all(),
            [
                'type_name' => 'required',

            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $bookingtypes = Bookingtypes::findOrFail($id);
            $bookingtypes->type_name = $request->input('type_name');

            $bookingtypes->save();

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
            Bookingtypes::findOrFail($id)->delete();

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
                Bookingtypes::where('id', $id)->delete();
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
        $bookingtypes = Bookingtypes::all();
        $pdf = PDF::loadView('admin.bookingtypes.print', compact('bookingtypes'));

        return $pdf->download('bookingtypes_data.pdf');
        /* //return $pdf->stream('bookingtypes_data.pdf'); //print to browser */
    }

    public function exportDetailPDF($id)
    {
        $bookingtypes = Bookingtypes::findOrFail($id);
        $pdf = PDF::loadView('admin.bookingtypes.print-details', compact('bookingtypes'));

        return $pdf->download('bookingtypes_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.bookingtypes.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request) {}

    /**
     * Export to csv and excel
     *
     * @return mixed
     */
    public function exportFile($type) {}
}
