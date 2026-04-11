<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class VerifierMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if (Auth::user()->hasPermissionTo('admin_roles_permissions')) {
            return $next($request);
        }
        if ($request->is('admin/booking/create')) {
            if (! Auth::user()->hasPermissionTo('booking_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/booking/delete/*')) {
            if (! Auth::user()->hasPermissionTo('booking_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/booking/edit/*')) {
            if (! Auth::user()->hasPermissionTo('booking_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/booking')) {
            if (! Auth::user()->hasPermissionTo('booking_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/customers/create')) {
            if (! Auth::user()->hasPermissionTo('customers_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/customers/delete/*')) {
            if (! Auth::user()->hasPermissionTo('customers_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/customers/edit/*')) {
            if (! Auth::user()->hasPermissionTo('customers_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/customers')) {
            if (! Auth::user()->hasPermissionTo('customers_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/drivers/create')) {
            if (! Auth::user()->hasPermissionTo('drivers_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/drivers/delete/*')) {
            if (! Auth::user()->hasPermissionTo('drivers_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/drivers/edit/*')) {
            if (! Auth::user()->hasPermissionTo('drivers_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/drivers')) {
            if (! Auth::user()->hasPermissionTo('drivers_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/invoices/create')) {
            if (! Auth::user()->hasPermissionTo('invoices_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/invoices/delete/*')) {
            if (! Auth::user()->hasPermissionTo('invoices_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/invoices/edit/*')) {
            if (! Auth::user()->hasPermissionTo('invoices_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/invoices')) {
            if (! Auth::user()->hasPermissionTo('invoices_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/usersettings')) {
            if (! Auth::user()->hasPermissionTo('usersettings_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/vehicles/create')) {
            if (! Auth::user()->hasPermissionTo('vehicles_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/vehicles/delete/*')) {
            if (! Auth::user()->hasPermissionTo('vehicles_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/vehicles/edit/*')) {
            if (! Auth::user()->hasPermissionTo('vehicles_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/vehicles')) {
            if (! Auth::user()->hasPermissionTo('vehicles_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/viaaddress/create')) {
            if (! Auth::user()->hasPermissionTo('viaaddress_create')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/viaaddress/delete/*')) {
            if (! Auth::user()->hasPermissionTo('viaaddress_delete')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/viaaddress/edit/*')) {
            if (! Auth::user()->hasPermissionTo('viaaddress_edit')) {
                abort('401');
            } else {
                return $next($request);
            }
        }
        if ($request->is('admin/viaaddress')) {
            if (! Auth::user()->hasPermissionTo('viaaddress_view')) {
                abort('401');
            } else {
                return $next($request);
            }
        }

        return $next($request);
    }
}
