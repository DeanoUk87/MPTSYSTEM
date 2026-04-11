<div class="main-sidebar-nav dark-navigation">
    <div class="nano">
        <div class="nano-content sidebar-nav">
            <ul class="metisMenu nav flex-column" id="menu">
                <div class="card-block border-bottom text-center nav-profile">
                </div>
                <li class="nav-heading"><span><?php echo app('translator')->get('app.system_menu'); ?></span></li>
                <li class="nav-item"><a class="nav-link" href="<?php echo e(url('home')); ?>" data-toggle="tooltip" title="<?php echo app('translator')->get('app.dashboard'); ?>"><i class="material-icons blue">dashboard</i> <span class="toggle-none"><?php echo app('translator')->get('app.dashboard'); ?> </span></a></li>
                
                <?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin')): ?>
                <li class="nav-item"><a class="nav-link" href="<?php echo e(route('kpi.index')); ?>" data-toggle="tooltip" title="KPI"><i class="material-icons green">receipt</i> <span class="toggle-none">KPI Dashboard</span> </a></li>
                <li class="nav-item">
                    <a class="nav-link" href="javascript: void(0);" aria-expanded="true" data-toggle="tooltip" title="<?php echo app('translator')->get('app.account'); ?>"><i class="material-icons purple">person_add</i> <span class="toggle-none"><?php echo app('translator')->get('app.account'); ?><span class="fa arrow"></span></span></a>
                    <ul class="nav-second-level nav flex-column sub-menu" aria-expanded="true">
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('users.index')); ?>"><?php echo app('translator')->get('app.users.title'); ?></a></li>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('roles.index')); ?>"><?php echo app('translator')->get('app.roles.title'); ?></a></li>
                        <li class="nav-item"><a class="nav-link" href="<?php echo e(route('permissions.index')); ?>"><?php echo app('translator')->get('app.permissions.title'); ?></a></li>
                    </ul>
                </li>
                <?php endif; ?>
                
                <?php if ($__env->exists('admin.menu')) echo $__env->make('admin.menu', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                <?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin')): ?>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</div>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/partials/nav-left.blade.php ENDPATH**/ ?>