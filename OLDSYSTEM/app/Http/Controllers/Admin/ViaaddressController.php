<?php

namespace App\Http\Controllers\Admin;

use App\Exports\ViaaddressExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\ViaaddressImports;
use App\Models\Viaaddress;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class ViaaddressController extends Controller
{
    use Uploader;

    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    public function index(Request $request)
    {
        return view('admin.viaaddress.index');
    }

    public function getdata()
    {

        if (Auth::user()->hasRole('admin')) {
            $viaaddress = Viaaddress::LeftJoin('users', 'users.id', '=', 'via_address.user_id')
                ->select('users.username', 'via_address.*')
                ->orderBy('via_id', 'desc');
        } else {
            $viaaddress = Viaaddress::LeftJoin('users', 'users.id', '=', 'via_address.user_id')
                ->select('users.username', 'via_address.*')
                ->where('via_address.user_id', $this->createdFor())
                ->orderBy('via_id', 'desc');
        }

        return Datatables::of($viaaddress)
            ->addColumn('checkbox', function ($viaaddress) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$viaaddress->via_id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$viaaddress->via_id.'"> 
                <label for="box-'.$viaaddress->via_id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($viaaddress) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$viaaddress->via_id.'" onclick="viewDetails(\''.url('admin/viaaddress/details').'\','.$viaaddress->via_id.')" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$viaaddress->via_id.'" onclick="editForm(\''.url('admin/viaaddress/edit').'\','.$viaaddress->via_id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$viaaddress->via_id.'" onclick="deleteData(\''.url('admin/viaaddress/delete').'\','.$viaaddress->via_id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    public function details($id)
    {
        $viaaddress = Viaaddress::findOrFail($id);

        return view('admin.viaaddress.details', compact('viaaddress'));
    }

    public function addressAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];

        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('via_address')
                ->where('name', 'LIKE', '%'.$term.'%')
                ->orWhere('postcode', 'LIKE', '%'.$term.'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('via_address')
                ->where(function ($query) use ($term) {
                    $query->where('name', 'LIKE', '%'.$term.'%')
                        ->orWhere('phone', 'LIKE', '%'.$term.'%');
                })
                ->where('user_id', $this->createdFor())
                ->limit(10)->get();
        }

        foreach ($queries as $query) {
            $results[] = [
                'id' => $query->via_id,
                'value' => $query->name,
                'address1' => $query->address1,
                'address2' => $query->address2,
                'area' => $query->area,
                'country' => $query->country,
                'postcode' => $query->postcode,
                'contact' => $query->contact,
                'phone' => $query->phone,
            ];
        }

        return response()->json($results);

    }

    public function addressName(Request $request)
    {
        $term = $request->input('postcode');
        if ($term) {
            $query = Viaaddress::where('name', 'LIKE', $term.'%')
                ->first();

            return $query->name;
        } else {
            return '';
        }
    }

    public function insert()
    {

        return view('admin.viaaddress.create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'name' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $data = [
                'user_id' => $this->createdFor(),
                'job_ref' => $request->input('job_ref'),
                'via_type' => $request->input('via_type'),
                'name' => $request->input('name'),
                'address1' => $request->input('address1'),
                'address2' => $request->input('address2'),
                'area' => $request->input('area'),
                'country' => $request->input('country'),
                'postcode' => $request->input('postcode'),
                'contact' => $request->input('contact'),
                'phone' => $request->input('phone'),
                'notes' => $request->input('notes'),
            ];
            Viaaddress::create($data);

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    public function edit($id)
    {

        $viaaddress = Viaaddress::findOrFail($id);

        return view('admin.viaaddress.edit', compact('viaaddress'));
    }

    public function update($id, Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'name' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $viaaddress = Viaaddress::findOrFail($id);
            $viaaddress->via_type = $request->input('via_type');
            $viaaddress->name = $request->input('name');
            $viaaddress->address1 = $request->input('address1');
            $viaaddress->address2 = $request->input('address2');
            $viaaddress->area = $request->input('area');
            $viaaddress->country = $request->input('country');
            $viaaddress->postcode = $request->input('postcode');
            $viaaddress->contact = $request->input('contact');
            $viaaddress->phone = $request->input('phone');
            $viaaddress->notes = $request->input('notes');
            $viaaddress->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success'),
            ]);
        }
    }

    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Viaaddress::where('via_id', $id)->update(['deleted_at' => Carbon::now()]);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function destroy2(Request $request, $id)
    {
        $info = Viaaddress::findOrFail($id);
        Viaaddress::where('via_id', $id)->update(['deleted_at' => Carbon::now()]);

        return redirect()->route('booking.edit', ['id' => $info->job_ref, 'action' => 'adjust'])->with('success', 'Via Address Modified. Click on the Update button below to apply changes');
    }

    public function destroyFile2(Request $request, $id)
    {
        if ($request->ajax()) {
            Viaaddress::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Viaaddress::where('via_id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }


    public function exportPDF(Request $request)
    {
        $viaaddress = Viaaddress::all();
        $pdf = Pdf::loadView('admin.viaaddress.print', compact('viaaddress'));
        $pdf->setPaper([0, 0, 1883.78, 2583.94], 'A4', 'landscape');

        return $pdf->download('viaaddress_data.pdf');
    }

    public function exportDetailPDF($id)
    {
        $viaaddress = Viaaddress::findOrFail($id);
        $pdf = Pdf::loadView('admin.viaaddress.print-details', compact('viaaddress'));

        return $pdf->download('viaaddress_data_details.pdf');
    }

    public function importExportView()
    {
        return view('admin.viaaddress.import');
    }

    public function importFile(Request $request)
    {
        if ($request->hasFile('viaaddress_file')) {
            $path = $request->file('viaaddress_file')->getRealPath();
            Excel::import(new ViaaddressImports, $path);

            return response()->json(['success' => true, 'message' => trans('app.import.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
    }

    public function exportFile($type)
    {
        return (new ViaaddressExports)->download('viaaddress.'.$type);
    }
}
