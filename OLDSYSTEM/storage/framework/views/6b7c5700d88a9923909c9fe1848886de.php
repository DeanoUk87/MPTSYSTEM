<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.drivers.title'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-admin.css')); ?>">
    <?php if(session('success')): ?>
        <div class="alert alert-success">
            <?php echo e(session('success')); ?>

        </div>
    <?php endif; ?>
    <?php if(session('error')): ?>
        <div class="alert alert-danger">
            <?php echo e(session('error')); ?>

        </div>
    <?php endif; ?>

    <div class="content-loader">
        <form action="<?php echo e(route('drivers.deletemulti')); ?>" method="post" id="hezecomform" class="form-horizontal">
            <?php echo e(csrf_field()); ?>

            <div class="row mb-2 htsDisplay">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <nav class="nav  justify-content-between">
                                <a class="navbar-brand"><?php echo app('translator')->get('main.drivers.title'); ?></a>
                                <div class="hts-flash"></div>
                                <div class="btn-group">
                                    <div class="dropdown">
                                        <button type="submit" class="btnDelete btn btn-danger btn-sm" name="btn-delete" id="btnStatus" style="display: none">
                                            <span class="fa fa-trash"></span> <?php echo app('translator')->get('app.delete'); ?>
                                        </button>
                                        <button class="btn btn-info btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="fa fa-cog"></i> <?php echo app('translator')->get('app.options'); ?>
                                        </button>
                                        <div class="dropdown-menu dropfix" aria-labelledby="dropdownOptions">
                                            <a class="dropdown-item" href="javascript:viod(0)" onclick="insertForm('<?php echo e(route('drivers.create')); ?>')"><?php echo app('translator')->get('app.create'); ?></a>
                                            
                                            <a class="dropdown-item" href="<?php echo e(route('drivers.export',['type'=>'xlsx'])); ?>"><?php echo app('translator')->get('app.export.xlsx'); ?></a>
                                            <a class="dropdown-item" href="<?php echo e(route('drivers.export',['type'=>'xls'])); ?>"><?php echo app('translator')->get('app.export.xls'); ?></a>
                                            <a class="dropdown-item" href="<?php echo e(route('drivers.export',['type'=>'csv'])); ?>"><?php echo app('translator')->get('app.export.csv'); ?></a>
                                            <a class="dropdown-item" href="<?php echo e(route('drivers.pdf')); ?>"><?php echo app('translator')->get('app.export.pdf'); ?></a>
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </div>
                        <div class="vItems">
                            <div class="card-body" style="padding: 10px 0 10px 0">
                                <table id="drivers_datatable"  class="table table-hover  table-responsive dt-responsive nowrap" cellspacing="0" style="width:100%">
                                    <thead>
                                    <tr class="text-primary">
                                        <td>
                                            <input type="checkbox" id="checkAll" class="check-style filled-in light-blue">
                                            <label for="checkAll" class="checklabel"></label>
                                        </td>
                                        
                                        <th><?php echo app('translator')->get('main.drivers.field.driver'); ?></th>
                                        <th>Type</th>
                                        <th><?php echo app('translator')->get('main.drivers.field.cost_per_mile'); ?></th>
                                        <th><?php echo app('translator')->get('main.drivers.field.cost_per_mile_weekends'); ?></th>
                                        <th><?php echo app('translator')->get('main.drivers.field.cost_per_mile_out_of_hours'); ?></th>
                                        <th><?php echo app('translator')->get('main.drivers.field.driver_email'); ?></th>
                                        <th><?php echo app('translator')->get('main.drivers.field.driver_phone'); ?></th>
                                        <th>Jobs</th>
                                        <th>Login Access</th>
                                        <th><?php echo app('translator')->get('app.actions'); ?></th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>;
<script type="text/javascript">
    var table = $('#drivers_datatable').DataTable({
        processing: true,
        serverSide: true,
        iDisplayLength:25,
        "order": [[1, "asc" ]],
        ajax: "<?php echo e(route('drivers.getdata')); ?>",
        columns: [
            {data: 'checkbox', name: 'checkbox',orderable: false, searchable: false},
            /*{data: 'username', name: 'username'},*/
            {data: 'driver', name: 'driver'},
            {data: 'driver_type', name: 'driver_type'},
            {data: 'cost_per_mile', name: 'cost_per_mile'},
            {data: 'cost_per_mile_weekends', name: 'cost_per_mile_weekends'},
            {data: 'cost_per_mile_out_of_hours', name: 'cost_per_mile_out_of_hours'},
            {data: 'driver_email', name: 'driver_email'},
            {data: 'driver_phone', name: 'driver_phone'},
            {data: 'jobs', name: 'jobs'},
            {data: 'access', name: 'access'},
            {data: 'action', name: 'action', orderable: false, searchable: false}
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "<?php echo app('translator')->get('app.search'); ?>"
        }
    });
</script>
<?php echo $__env->make('partials.customjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>;
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/drivers/index.blade.php ENDPATH**/ ?>