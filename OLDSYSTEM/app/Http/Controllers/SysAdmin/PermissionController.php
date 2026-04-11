<?php

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\PermissionsGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Validator;
use Yajra\Datatables\Datatables;

class PermissionController extends Controller
{
    use PermissionsGenerator;

    public function __construct()
    {
        $this->middleware(['auth', 'admin', '2fa']);
    }

    /**
     * Data base label
     *
     * @return array
     */
    public function table()
    {
        return [
            'tableVar' => 'permissions',
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return view('sysadmin.permissions.index', $this->table());
    }

    /**
     * Load post data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $data = Permission::all();

        return Datatables::of($data)
            ->addColumn('action', function ($data) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="#" data-id="row-'.$data->id.'" onclick="editForm(\''.url('admin/permissions/edit').'\','.$data->id.')" class="btn btn-info btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="#" data-id="row-'.$data->id.'" onclick="deleteData(\''.url('admin/permissions/delete').'\','.$data->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['action'])->make(true);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::get();

        return view('sysadmin.permissions.create')->with('roles', $roles);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return mixed
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), ['name' => 'required|max:40', 'route' => 'required|max:100']);
        if ($validator->fails()) {
            return response()->json(['message' => 'The permission name and route cannot be empty']);
        } else {
            $name = $request['name'];
            $permission = new Permission;
            $permission->name = $name;
            $permission->route = $request['route'];
            $roles = $request['roles'];
            $permission->save();
            if (! empty($request['roles'])) {
                foreach ($roles as $role) {
                    $r = Role::where('id', '=', $role)->firstOrFail(); // Match input role to db record

                    $permission = Permission::where('name', '=', $name)->first();
                    $r->givePermissionTo($permission);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Permission Added Successfully',
            ]);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return mixed
     */
    public function show($id)
    {
        return redirect('admin/permissions');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return mixed
     */
    public function edit($id)
    {
        $permission = Permission::find($id);

        return view('sysadmin.permissions.edit', compact('permission'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     * @return mixed
     */
    public function update(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);
        $validator = Validator::make($request->all(), ['name' => 'required|max:50']);
        if ($validator->fails()) {
            return response()->json(['message' => 'The field cannot empty']);
        } else {
            $input = $request->all();
            $permission->fill($input)->save();

            return response()->json([
                'success' => true,
                'message' => 'Record Updated Successfully',
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return mixed
     */
    public function destroy($id)
    {
        $permission = Permission::findOrFail($id);

        if ($permission->name == 'administer_roles_permissions') {
            return response()->json([
                'message' => 'You cannot delete this Permission!',
            ]);
        }

        $permission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Permission Deleted Successfully',
        ]);
    }

    public function GeneratePermission()
    {
        $this->CreatePermissions();
        $this->CreateMiddlewarePermission();

        return back()->withInput()->with('status', 'Permission Middleware Updated Successfully!');
    }
}
