<?php

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    use Uploader;
    /*
    |--------------------------------------------------------------------------
    | Profile Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles the profile of new users as well as their
    | validation and creation. By default this controller uses a trait to
    | provide this functionality without requiring any additional code.
    |
    */

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Validation rule
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|min:5|max:100',
        ];
    }

    /**
     * Get a validator for an incoming registration request.
     *
     * @return \Illuminate\Contracts\Validation\Validator
     */
    protected function validator(array $data)
    {
        return Validator::make($data, [
            $this->rules(),
        ]);
    }

    public function profile()
    {
        $user = Auth::user();

        // return view('user.profile')->with(['user' => $user]);
        return view('sysadmin.profile.update', ['user' => $user]);
    }

    public function updatepro(Request $request)
    {
        $user = Auth::user();
        $user->name = $request->input('name');

        $validator = Validator::make($request->all(), $this->rules());

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->all(),
            ]);
        } else {
            // Logic for user upload of avatar
            if ($request->hasFile('avatar')) {
                // you can customize the validation to meet your need. Just replace $this->mixedRules() with yours e.g [mines:jpg,png...]
                $valFile = Validator::make($request->all(), [$this->imageRules()]);
                if ($valFile->fails()) {
                    return response()->json(['message' => $valFile->errors()->all()]);
                } else {
                    $filekey = $request->file('avatar');
                    // upload dir default is /uploads
                    $filename = $this->singleupload($filekey, 'resize', 'uploads/avatars');
                    // delete existing file
                    if ($user->avatar) {
                        $this->deleteFile('uploads/avatars/'.$user->avatar);
                    }
                    $user->avatar = $filename;
                }
            }
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Record Updated Successfully',
            ]);
        }
    }

    /**
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function UpdatePassword()
    {
        return view('sysadmin.profile.updatepassword');
    }

    /**
     * Update the password for the user.
     */
    public function UpdatePasswordPro(Request $request)
    {
        // Validate the new password length...
        $validator = Validator::make($request->all(),
            ['password' => 'required|string|min:6|confirmed']
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $user = Auth::user();
            $user->password = $request->input('password');
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password Changed Successfully',
            ]);
        }
    }
}
