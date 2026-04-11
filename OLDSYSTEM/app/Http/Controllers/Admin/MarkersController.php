<?php

namespace App\Http\Controllers\Admin;

use App\Exports\MarkersExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\MarkersImports;
use App\Models\Markers;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class MarkersController extends Controller
{
    use Uploader;

    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    public function showMap(Request $request)
    {
        $postcodes = Markers::select('postcode', 'lat', 'lng')->get();

        return view('admin.markers.map', compact('postcodes'));
    }

    public function index(Request $request)
    {
        return view('admin.markers.index');
    }

    public function getdata()
    {
        $markers = Markers::query();

        return Datatables::of($markers)
            ->addColumn('checkbox', function ($markers) {
                return '<input type="checkbox" name="checkbox[]" id="box-' . $markers->id . '" class="check-style filled-in blue"  onclick="toggleBtn()" value="' . $markers->id . '"> 
                <label for="box-' . $markers->id . '" class="checkinner"></label>';
            })
            ->addColumn('action', function ($markers) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-' . $markers->id . '" onclick="editForm(\'' . url('admin/markers/edit') . '\',' . $markers->id . ')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-' . $markers->id . '" onclick="deleteData(\'' . url('admin/markers/delete') . '\',' . $markers->id . ')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    public function details($id)
    {
        $markers = Markers::findOrFail($id);

        return view('admin.markers.details', compact('markers'));
    }

    public function insert()
    {

        return view('admin.markers.create');
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'postcodes' => 'required',
            ]
        );
        if ($validator->fails()) {
            return back()->with('error', 'Postcode field is required');
        } else {
            $error = [];
            $postcodes = $request->input('postcodes');
            $postcodes = preg_split('/\r\n|[\r\n]/', $postcodes);
            foreach ($postcodes as $code) {
                $url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' . str_replace(' ', '', $code) . '&key=' . env('GOOGLE_API_KEY') . '';
                $lat = get_object_vars(json_decode(file_get_contents($url)));
                if ($lat['status'] == 'OK') {
                    Markers::create([
                        'postcode' => trim($code),
                        'lng' => $lat['results'][0]->geometry->location->lng,
                        'lat' => $lat['results'][0]->geometry->location->lat,
                    ]);
                } else {
                    $error[] = $code;
                }

            }
            if ($error) {
                return back()->with('status', $error);
            } else {
                return back()->with('success', 'Postcode imported successfully.');
            }
        }
    }

    public function edit($id)
    {

        $markers = Markers::findOrFail($id);

        return view('admin.markers.edit', compact('markers'));
    }

    public function update($id, Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'postcode' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $markers = Markers::findOrFail($id);
            $markers->postcode = $request->input('postcode');
            $markers->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success')]);
        }
    }

    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Markers::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Markers::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function importExportView()
    {
        return view('admin.markers.import');
    }

    public function importFile(Request $request)
    {
        if ($request->hasFile('markers_file')) {
            $path = $request->file('markers_file')->getRealPath();
            Excel::import(new MarkersImports, $path);

            return response()->json(['success' => true, 'message' => trans('app.import.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
    }

    public function exportFile($type)
    {
        return (new MarkersExports)->download('markers.' . $type);
    }
public function truncateTable(Request $request)
{
    if (!$request->ajax()) {
        return redirect()->route('markers.index');
    }

    \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
    Markers::truncate();
    \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    return response()->json([
        'success' => true,
        'message' => 'All markers deleted successfully.'
    ]);
}}
