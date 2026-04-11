<?php

namespace App\Http\Middleware;

use App\User;
use Closure;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $user = User::all()->count();
        if (! ($user == 1)) {
            if (! Auth::user()->hasPermissionTo('admin_roles_permissions')) {
                abort('401');
            }
        }

        return $next($request);
    }
}
