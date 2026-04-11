<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Models\Usersettings;
use DB;
use Illuminate\Http\Request;
use Validator;

class UsersettingsController extends Controller
{
    use Uploader;

    /**
     * UsersettingsController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    /**
     * This method display usersettings view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        if (Usersettings::where('user_id', $this->createdFor())->count() > 0) {
            $usersettings = Usersettings::where('user_id', $this->createdFor())->first();

            return view('admin.usersettings.edit', compact('usersettings'));
        } else {
            return view('admin.usersettings.create');
        }
    }

    public function store(Request $request)
    {
        /* validate usersettings data */
        $validator = Validator::make($request->all(),
            [
                'business_name' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $data = [
                'user_id' => $this->createdFor(), // $request->input('user_id'),
                'business_name' => $request->input('business_name'),
                'email_address' => $request->input('email_address'),
                'address_for_invoice' => $request->input('address_for_invoice'),
                'vat' => $request->input('vat'),
                'terms' => $request->input('terms'),
                'invoice_message' => $request->input('invoice_message'),
                'job_message' => $request->input('job_message'),
            ];
            $data = Usersettings::create($data);

            if ($request->hasFile('upload_logo')) {
                $valFile = Validator::make($request->all(), [$this->imageRules()]);
                if ($valFile->fails()) {
                    return response()->json(['error' => true, 'message' => $valFile->errors()->all()]);

                } else {
                    $filekey = $request->file('upload_logo');
                    $filename = $this->singleupload($filekey, 'mixed'); /* use 'mixed' or 'resize' */
                    $data->update(['upload_logo' => $filename]);
                }
            }

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * This method process usersettings edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate usersettings data */
        $validator = Validator::make($request->all(),
            [
                'business_name' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $usersettings = Usersettings::findOrFail($id);
            $usersettings->business_name = $request->input('business_name');
            $usersettings->email_address = $request->input('email_address');
            $usersettings->address_for_invoice = $request->input('address_for_invoice');
            $usersettings->vat = $request->input('vat');
            $usersettings->terms = $request->input('terms');
            $usersettings->invoice_message = $request->input('invoice_message');
            $usersettings->job_message = $request->input('job_message');
            if ($request->hasFile('upload_logo')) {
                $valFile = Validator::make($request->all(), [$this->imageRules()]);
                if ($valFile->fails()) {
                    return response()->json(['error' => true, 'message' => $valFile->errors()->all()]);

                } else {
                    $filekey = $request->file('upload_logo');
                    $filename = $this->singleupload($filekey, 'mixed'); /* use 'mixed' or 'resize' */
                    $usersettings->upload_logo = $filename;
                }
            }
            $usersettings->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success'),
            ]);
        }
    }
}
