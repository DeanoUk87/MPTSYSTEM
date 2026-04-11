<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Jobaccess;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Yajra\Datatables\Datatables;

class JobaccessController extends Controller
{
    use Uploader;

    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }


    public function index(Request $request)
    {
        return view('admin.jobaccess.index');
    }

    public function getdata()
    {
        $jobaccess = Jobaccess::join('users', 'users.id', '=', 'job_access.user_id')
            ->select('users.name', 'job_access.*');

        return Datatables::of($jobaccess)
            ->addColumn('checkbox', function ($jobaccess) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$jobaccess->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$jobaccess->id.'"> 
                <label for="box-'.$jobaccess->id.'" class="checkinner"></label>';
            })
            ->editColumn('access', function ($jobaccess) {
                if ($jobaccess->access == 1) {
                    return '<a href="javascript::void(0)" class="btn btn-outline-success btn-xs">Yes</i></a>
                            <a href="'.route('job.access', ['id' => $jobaccess->id, 'type' => 2, 'admin' => 1]).'" class="btn btn-outline-danger btn-xs">Revoke</i></a>';
                }

                return '<a href="javascript::void(0)" class="btn btn-outline-dark btn-xs">No</a>';
            })
            ->editColumn('isRequest', function ($jobaccess) {
                if ($jobaccess->isRequest == 1) {
                    return '<a href="javascript::void(0)" class="btn btn-outline-dark btn-xs">Pending</i></a>';
                } elseif ($jobaccess->isRequest == 2) {
                    return '<a href="javascript::void(0)" class="btn btn-outline-success btn-xs">Accepted</i></a>';
                }

                return '<a href="javascript::void(0)" class="btn btn-outline-dark btn-xs">Declined</a>';
            })
            ->addColumn('action', function ($jobaccess) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="javascript:viod(0)" data-id="row-'.$jobaccess->id.'" onclick="deleteData(\''.url('admin/jobaccess/delete').'\','.$jobaccess->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'access', 'isRequest'])->make(true);
    }

    public function access(Request $request, $id, $type)
    {
        if ($request->input('admin')) {
            $job = Jobaccess::where('id', $id);
            if ($job->count() > 0 and $type == 1) { // accept
                $updateAll = Jobaccess::where('job_id', $job->first()->job_id)->update(['access' => 0]);
                if ($updateAll) {
                    $job->update(['access' => 1]);
                }

                return redirect()->back()->with('success', 'Access has been been successfully.');
            } elseif ($job->count() > 0 and $type == 2) { // denied
                $job->update(['access' => 0]);

                return redirect()->back()->with('success', 'Access has been denied successfully.');
            } else { // none
                return redirect()->back()->with('error', 'Unable to grant or deny access.');
            }
        } else {
            $job = Jobaccess::where('id', $id)->where('isRequest', 1)->where('access', 0);
            if ($job->count() > 0 and $type == 1) { // accept
                $updateAll = Jobaccess::where('job_id', $job->first()->job_id)->update(['access' => 0]);
                if ($updateAll) {
                    $job->update(['access' => 1, 'isRequest' => 2]);
                }

                return redirect()->route('booking.index', ['user' => 0])->with('success', 'Access has been been successfully.');
            } elseif ($job->count() > 0 and $type == 2) { // denied
                $job->update(['access' => 0, 'isRequest' => 3]);

                return redirect()->back()->with('success', 'Access has been denied successfully.');
            } else { // none
                return redirect()->route('booking.index', ['user' => 0])->with('error', 'Unable to grant or deny access.');
            }
        }

    }

    public function revokeAccess($id)
    {
        $job = Jobaccess::where('job_id', $id);
        $prviousUrl = session('previous');
        if ($job->count() > 0) {
            $job->update(['access' => 0]);

            return redirect()->to($prviousUrl);
        } else {
            return redirect()->to($prviousUrl);
        }

    }

    public function update(Request $request, $id)
    {
        $userId = Auth::user()->id;
        $jobId = $request->input('job_id');
        $access = Jobaccess::updateOrCreate(
            ['job_id' => $jobId, 'user_id' => $userId],
            ['job_id' => $jobId, 'user_id' => $userId, 'access' => 0, 'isRequest' => 1]
        );
        if ($access) {
            return redirect()->route('jobaccess.edit', ['id' => $jobId, 'sent' => 1])->with('success', 'Access request sent successfully.');
        }
        return null;
    }

    public function forceAccess($id)
    {
        $userId = Auth::user()->id;

        Jobaccess::updateOrCreate(
            ['job_id' => $id, 'user_id' => $userId],
            ['job_id' => $id, 'user_id' => $userId, 'access' => 0, 'isRequest' => 1]
        );

        Jobaccess::where('job_id', $id)->where('user_id', '!=', $userId)->update(['access' => 0]);
        Jobaccess::where('job_id', $id)->where('user_id', $userId)->update(['access' => 1, 'isRequest' => 2]);

        return redirect()->route('booking.edit', ['id' => $id])
            ->with('success', 'Force access granted. You now have access to this job.');
    }

    public function edit($id)
    {
        $user = Auth::user()->id;
        $query = Jobaccess::join('users', 'users.id', '=', 'job_access.user_id')
            ->select('users.name', 'job_access.*')
            ->where('job_id', $id)
            ->where('access', 1);
        if ($query->count()) {
            $jobaccess = $query->first();

            return view('admin.jobaccess.edit', compact('jobaccess', 'user'));
        } else {
            return redirect()->route('booking.index', ['user' => 0]);
        }
    }

    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Jobaccess::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Jobaccess::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function truncate()
    {
        Jobaccess::truncate();

        return redirect()->back()->with('success','Data cleared successfully.');
    }
}
