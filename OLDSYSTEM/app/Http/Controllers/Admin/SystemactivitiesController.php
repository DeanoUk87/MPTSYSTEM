<?php


namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\System\Upload;
use App\Models\Systemactivities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Yajra\DataTables\Facades\DataTables;

class SystemactivitiesController extends Controller
{
    use Uploader;

    /**
     * SystemactivitiesController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display systemactivities view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.systemactivities.index');
    }

    /**
     * Load systemactivities data for view table
     *
     * @return mixed
     * @throws \Exception
     */
    public function getdata()
    {
        $systemactivities = Systemactivities::join('users', 'users.id', '=', 'system_activities.user_id')
            ->select('system_activities.*', 'users.username')
            ->get();

        return Datatables::of($systemactivities)
            ->addColumn('checkbox', function ($systemactivities) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$systemactivities->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$systemactivities->id.'"> 
                <label for="box-'.$systemactivities->id.'" class="checkinner"></label>';
            })
            ->addColumn('action', function ($systemactivities) {
            })
            ->rawColumns(['checkbox', 'action'])->make(true);
    }

    /**
     * This method select systemactivities details with related files.
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $systemactivities = Systemactivities::findOrFail($id);
        $uploads = Upload::where('relatedId', $systemactivities->id)->where('tablekey', 'systemactivities')->get();

        return view('admin.systemactivities.details', compact('systemactivities', 'uploads'));
    }

    /**
     * This method delete record from database
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Systemactivities::findOrFail($id)->delete();

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
                Systemactivities::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function truncateTable()
    {
        Systemactivities::truncate();

        return redirect()->route('systemactivities.index')->with('success', 'All system log data have been cleared!');
    }
}
