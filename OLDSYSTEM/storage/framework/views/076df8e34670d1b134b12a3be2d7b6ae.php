<?php if(!Auth::user()->hasRole('driver')): ?>
    <?php if(!Auth::user()->hasRole('customer')): ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','booking_view','booking_create','booking_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('booking.create')); ?>" data-toggle="tooltip" title="Start New Job">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    <span class="toggle-none"> Start New Job</span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','booking_view','booking_create','booking_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" data-toggle="tooltip" title="View <?php echo app('translator')->get('main.booking.menu'); ?>" href="<?php echo e(route('booking.index',['user'=>0, 'date1'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'date2'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d')])); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#f97316; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <span class="toggle-none"> View <?php echo app('translator')->get('main.booking.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('jobaccess.index')); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#84cc16; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.jobaccess.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','customers_view','customers_create','customers_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('customers.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.customers.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#6366f1; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.customers.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','drivers_view','drivers_create','drivers_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('drivers.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.drivers.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.drivers.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','vehicles_view','vehicles_create','vehicles_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('vehicles.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.vehicles.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#a855f7; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 5H4m0 0l4 4m-4-4l4-4"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.vehicles.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','viaaddress_view','viaaddress_create','viaaddress_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('viaaddress.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.viaaddress.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.viaaddress.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(!Auth::user()->hasRole('booking1')): ?>
            <li class="nav-item">
                <a class="nav-link" href="javascript: void(0);" aria-expanded="true" data-toggle="tooltip" title="Accounting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#f97316; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span class="toggle-none"> Accounting <span class="fa arrow"></span></span>
                </a>
                <ul class="nav-second-level nav flex-column sub-menu" aria-expanded="true">
                    <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','invoices_gen'])): ?>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('booking.invoice',['user'=>0])); ?>">Generate Invoice</a></li>
                    <?php endif; ?>
                    <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','invoices_view','invoices_create','invoices_edit'])): ?>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('invoices.index')); ?>">View <?php echo app('translator')->get('main.invoices.menu'); ?></a></li>
                    <?php endif; ?>
                    <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','invoices_view','invoices_create','invoices_edit'])): ?>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('invoices.customers')); ?>">Date Range</a></li>
                    <?php endif; ?>
                    <?php if(!Auth::user()->hasRole('driver')): ?>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('derbyjobs.index')); ?>"><?php echo app('translator')->get('main.derbyjobs.menu'); ?></a></li>
                    <?php endif; ?>
                </ul>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','bookingtypes_view','bookingtypes_create','bookingtypes_edit'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('bookingtypes.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.bookingtypes.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#84cc16; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.bookingtypes.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','postcode_map'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('markers.map')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.markers.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#3b82f6; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.markers.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','geotracking'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('geotracking.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.geotracking.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.geotracking.menu'); ?></span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','storages'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('storages.index')); ?>" data-toggle="tooltip" title="Units">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#f97316; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                    <span class="toggle-none"> Units</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('storages.notification')); ?>" data-toggle="tooltip" title="Unit Alerts">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#3b82f6; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <span class="toggle-none"> Unit Alerts</span>
                </a>
            </li>
        <?php endif; ?>

        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions'])): ?>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('fuelsurcharges.index')); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.fuelsurcharges.menu'); ?></span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('backup.list')); ?>" data-toggle="tooltip" title="Backups">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#22c55e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/></svg>
                    <span class="toggle-none"> Backups</span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('usersettings.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.usersettings.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#92400e; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.usersettings.menu'); ?></span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('systemactivities.index')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('main.systemactivities.menu'); ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#3b82f6; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    <span class="toggle-none"> <?php echo app('translator')->get('main.systemactivities.menu'); ?></span>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="<?php echo e(route('settings.index')); ?>" data-toggle="tooltip" title="Clear Cache">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#84cc16; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <span class="toggle-none"> Clear Cache</span>
                </a>
            </li>
        <?php endif; ?>
    <?php endif; ?>
<?php endif; ?>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/menu.blade.php ENDPATH**/ ?>