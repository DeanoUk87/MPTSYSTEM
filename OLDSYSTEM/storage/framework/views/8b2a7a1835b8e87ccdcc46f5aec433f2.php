<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('app.dashboard'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>

<link rel="stylesheet" href="<?php echo e(asset('css/booking-admin.css')); ?>">

    <div class="dashboard-stat">
        <?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin')): ?>
        <div class="row justify-content-center pb-5">
            <div class="col col-12 ">
                <form method="get" name="form1"  class="form-horizontal" tabindex="1">
                    <div class="row">
                        <div class="col-md-6 col-sx-12 ">
                            <div class="form-group">
                                <div class="input-group m-b">
                                    <span class="input-group-addon "><i class="fa fa-calendar fa fa-calendar"></i></span>
                                    <?php if($date1): ?>
                                        <input type="text"  class="form-control date1" name="date1" value="<?php echo e($date1); ?>" />
                                        <input type="text"  class="form-control date1" name="date2" value="<?php echo e($date2); ?>" />
                                    <?php else: ?>
                                        <input type="text"  class="form-control date1" name="date1"  />
                                        <input type="text"  class="form-control date1" name="date2"  />
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sx-12" style="padding-left:0;">
                            <button type="submit" class="btn btn-info" name="search">View</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-danger">
                                    <i class="fa fa-user-circle highlight-icon blue" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin')): ?>
                                <p class="card-text text-dark">Users</p>
                                <h5 class="bold-text"><?php echo e($users); ?></h5>
                                <?php else: ?>
                                    <p class="card-text text-dark">Welcome</p>
                                    <?php endif; ?>
                            </div>
                        </div>
                        <p class="text-muted">
                            <?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin')): ?>
                            <i class="fa fa-exclamation-circle mr-1" aria-hidden="true"></i> Total Users
                            <?php else: ?>
                                <i class="fa fa-exclamation-circle mr-1" aria-hidden="true"></i> <?php echo e(Auth::user()->name); ?>

                                <?php endif; ?>
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-user highlight-icon purple" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Customers</p>
                                <h5 class="bold-text"><?php echo e($customers); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Customers
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics ">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-car highlight-icon light-green" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Vehicles</p>
                                <h5 class="bold-text"><?php echo e($vehicles); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Vehicles
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-drivers-license highlight-icon indigo" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Drivers</p>
                                <h5 class="bold-text"><?php echo e($drivers); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Drivers
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <?php if($date1): ?>
            <h5 class="text-danger text-center"> Reports from <?php echo e($date1); ?> - <?php echo e($date2); ?></h5>
        <?php endif; ?>
        <div class="row">
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon orange" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Total Booking </p>
                                <h5 class="bold-text"><?php echo env('CURRENCY_SYMBOL'); ?><?php echo e(number_format($booking,2)); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> Count: <?php echo e(number_format($bookingCount)); ?>

                        </p>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon blue" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Driver Cost</p>
                                <h5 class="bold-text"><?php echo env('CURRENCY_SYMBOL'); ?><?php echo e(number_format(($driverCost+$subConCost+$cxDriverCost),2)); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> Drivers/SubCon
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon green" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Profit</p>
                                <h5 class="bold-text"><?php echo env('CURRENCY_SYMBOL'); ?><?php echo e(number_format($profit,2)); ?></h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> All time profit
                        </p>
                    </div>
                </div>
            </div>
        </div><br>
        <?php endif; ?>

        <div class="card-deck">
            <div class="card col-lg-12 px-0 mb-4">
                <div class="card-header">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand"><i class="fa fa-calendar"></i> Today's Booking</a>
                        <div class="btn-group">
                            <div class="dropdown">
                                <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions','booking_view','booking_create','booking_edit'])): ?>
                                    <a class="btn btn-sm btn-indigo" href="<?php echo e(route('booking.index',['user'=>0, 'date1'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'date2'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d')])); ?>">
                                        <i class="fa fa-table"></i> Booking Area
                                    </a>
                                    <a class="btn btn-sm btn-danger" href="<?php echo e(route('booking.create')); ?>">
                                        <i class="fa fa-plus"></i>  Start New Booking
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    </nav>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table id="booking_datatable" class="table center-aligned-table">
                            <thead>
                            <tr class="text-primary">
                                <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
                                <th>From</th>
                                <th>To</th>
                                <th><?php echo app('translator')->get('main.booking.field.customer'); ?></th>
                                <th><?php echo app('translator')->get('main.booking.field.driver'); ?></th>
                                <th><?php echo app('translator')->get('main.booking.field.vehicle'); ?></th>
                                <?php if(!Auth::user()->hasRole('booking1')): ?>
                                    <th>Total</th>
                                <?php endif; ?>
                            </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
<?php $__env->stopSection(); ?>


<?php $__env->startSection('scripts'); ?>;
<script type="text/javascript">
    var table = $('#booking_datatable').DataTable({
        processing: true,
        serverSide: true,
        bSort: false,
        ajax: "<?php echo e(route('booking.search',['user'=>0, 'fromdate'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'todate'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'customer'=>0,'driver'=>0,'archive'=>0,'btype'=>0])); ?>",
        columns: [
            {data: 'job_ref', name: 'job_ref'},
            {data: 'from', name: 'from'},
            {data: 'to', name: 'to'},
            {data: 'customerName', name: 'customerName'},
            {data: 'driverName', name: 'driverName'},
            {data: 'vehicleName', name: 'vehicleName'},
                <?php if(!Auth::user()->hasRole('booking1')): ?>
            {data: 'cost', name: 'cost'},
            <?php endif; ?>
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "search"
        }
    });
</script>
<?php echo $__env->make('partials.customjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>;
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/sysadmin/index.blade.php ENDPATH**/ ?>