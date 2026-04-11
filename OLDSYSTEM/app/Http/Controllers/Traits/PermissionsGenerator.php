<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

// use File;
trait PermissionsGenerator
{
    public function CreatePermissions()
    {
        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE TABLE_SCHEMA='".env('DB_DATABASE')."'");

        $except = ['users', 'roles', 'role_has_permissions', 'permissions', 'password_resets', 'model_has_roles', 'model_has_permissions', 'migrations', 'hts_uploads'];
        foreach ($tables as $table) {

            $tableName = $table->table_name;
            $tableLabel = str_replace(['hez_', 'hts_', '_', '-'], '', $tableName);

            if (! in_array($tableName, $except)) {
                Permission::firstOrCreate(['name' => $tableLabel.'_view'], ['name' => $tableLabel.'_view', 'route' => 'admin/'.$tableLabel, 'guard_name' => 'web']);
                Permission::firstOrCreate(['name' => $tableLabel.'_create'], ['name' => $tableLabel.'_create', 'route' => 'admin/'.$tableLabel.'/create', 'guard_name' => 'web']);
                Permission::firstOrCreate(['name' => $tableLabel.'_edit'], ['name' => $tableLabel.'_edit', 'route' => 'admin/'.$tableLabel.'/edit/*', 'guard_name' => 'web']);
                Permission::firstOrCreate(['name' => $tableLabel.'_delete'], ['name' => $tableLabel.'_delete', 'route' => 'admin/'.$tableLabel.'/delete/*', 'guard_name' => 'web']);
                Permission::firstOrCreate(['name' => $tableLabel.'_export'], ['name' => $tableLabel.'_export', 'route' => 'admin/'.$tableLabel.'/export/*', 'guard_name' => 'web']);
                Permission::firstOrCreate(['name' => $tableLabel.'_import'], ['name' => $tableLabel.'_import', 'route' => 'admin/'.$tableLabel.'/import/*', 'guard_name' => 'web']);
            }
        }
    }

    public function CreateMiddlewarePermission()
    {
        // $this->CreatePermissions();

        $permit = "<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class VerifierMiddleware {
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  ".'$'."request
     * @param  \Closure  ".'$'.'next
     * @return mixed
     */
    public function handle('.'$'.'request, Closure '.'$'."next) {        
        if (Auth::user()->hasPermissionTo('admin_roles_permissions')) {
            return ".'$'.'next('.'$'.'request);
        }';

        foreach (Permission::orderBy('name')->get() as $row) {
            if ($row->name != 'admin_roles_permissions') {
                $permit .= '
        if ('.'$'."request->is('".$row->route."')) {
            if (!Auth::user()->hasPermissionTo('".$row->name."')) {
                abort('401');
            } else {
                return ".'$'.'next('.'$'.'request);
            }
        }';
            }
        }
        $permit .= '
        return '.'$'.'next('.'$'.'request);
    }
}
';
        Storage::disk('app')->put('Http/Middleware/VerifierMiddleware.php', $permit);

        return back()->withInput()->with('status', 'Permission Middleware Updated Successfully!');
    }
}
