<?php

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Validator;
use Yajra\Datatables\Datatables;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    /**
     * Validation rule
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'required|unique:roles|max:10',
            'permissions' => 'required',
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
            'tableVar' => 'roles',
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return mixed
     */
    public function index()
    {
        return view('sysadmin.roles.index', $this->table());
    }

    /**
     * Load post data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $data = Role::all();

        return Datatables::of($data)
            ->editColumn('permissions', function ($data) {
                return $data->permissions()->pluck('name')->implode(' | ').'';
            })

            ->addColumn('action', function ($data) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="#" data-id="row-'.$data->id.'" onclick="editForm(\''.url('admin/roles/edit').'\','.$data->id.')" class="btn btn-info btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="#" data-id="row-'.$data->id.'" onclick="deleteData(\''.url('admin/roles/delete').'\','.$data->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['action'])->make(true);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return mixed
     */
    public function create()
    {
        $permissions = Permission::all();

        return view('sysadmin.roles.create', ['permissions' => $permissions]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(),
            [
                'name' => 'required|unique:roles|max:20',
            ]
        );
        if ($validator->fails()) {
            // return response()->json(['message'=>$validator->errors()]);
            return response()->json(['error' => true, 'message' => 'Invalid Role Name']);
        } else {
            $name = $request['name'];
            $role = new Role;
            $role->name = $name;
            $permissions = $request['permissions'];
            $role->save();
            if ($permissions) {
                foreach ($permissions as $permission) {
                    $p = Permission::where('id', '=', $permission)->firstOrFail();
                    $role = Role::where('name', '=', $name)->first();
                    $role->givePermissionTo($p);
                }
            }

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
     * @return mixed
     */
    public function show($id)
    {
        return redirect('admin/roles');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     */
    public function edit($id)
    {
        $role = Role::findOrFail($id);
        $permissions = Permission::all();
        $roles = $role->permissions->pluck('id')->toArray();
        if (in_array($role->name, ['customer', 'driver', 'booking1', 'admin'])) {
            $input = 'readonly';
        } else {
            $input = '';
        }

        return view('sysadmin.roles.edit', compact('role', 'permissions', 'input', 'roles'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  int  $id
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $validator = Validator::make($request->all(),
            [
                'name' => 'required|max:20|unique:roles,name,'.$id,
                'permissions' => 'required',
            ]
        );
        if ($validator->fails()) {
            // return response()->json(['message'=>$validator->errors()]);
            return response()->json(['message' => $validator->errors()->all()]);
        } else {
            $input = $request->except(['permissions']);
            $permissions = $request['permissions'];
            $role->fill($input)->save();
            $p_all = Permission::all();

            foreach ($p_all as $p) {
                $role->revokePermissionTo($p);
            }

            foreach ($permissions as $permission) {
                $p = Permission::where('id', '=', $permission)->firstOrFail(); // Get corresponding form permission in db
                $role->givePermissionTo($p);
            }

            return response()->json([
                'success' => true,
                'message' => 'Record Added Successfully',
            ]);
        }
    }

    /**
     * Remove the specified resource from storage
     *
     * @param  int  $id
     */
    public function destroy($id)
    {
        Role::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Record Deleted Successfully',
        ]);
    }
}
