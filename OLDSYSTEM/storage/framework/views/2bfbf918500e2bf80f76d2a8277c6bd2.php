<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-admin.css')); ?>">

<div class="row mb-2 htsDisplay">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header" style="">
                <nav class="nav  justify-content-between">
                    <a class="navbar-brand"><?php echo app('translator')->get('main.drivers.update'); ?></a>
                    <a href="javascript:viod(0)" class="btn btn-info btn-sm" onclick="viewAll('<?php echo e(route('drivers.index')); ?>')"><i class="fa fa-reply"></i> <?php echo app('translator')->get('app.goback'); ?></a>
                </nav>
            </div>
            <div class="card-body">
                <div class="hts-flash"></div>
                <form action="<?php echo e(route('drivers.update',['id'=>$drivers->driver_id])); ?>" method="post" id="hezecomform" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
                    <?php echo e(csrf_field()); ?>

                     <input type="hidden" name="driver_id" value="<?php echo e($drivers->driver_id); ?>">

                    <div class="form-group">
                        <select name="driver_type" id="driver_type" class="form-control styler">
                            <option value="<?php echo e($drivers->driver_type); ?>"><?php echo e($drivers->driver_type); ?></option>
                            <option value="Driver">Driver</option>
                            <option value="SubContractor">SubContractor</option>
                            <option value="CXDriver">CX Driver</option>
                        </select>
                    </div>

	                <div class="form-group">
                        <label class="control-label" for="driver"><?php echo app('translator')->get('main.drivers.field.driver'); ?></label>
	                     <input id="driver" name="driver" class="form-control styler" type="text" maxlength="50"  value="<?php echo e($drivers->driver); ?>" />
	                </div>

                    <div class="form-group">
                        <label class="control-label" for="cost_per_mile"><?php echo app('translator')->get('main.drivers.field.cost_per_mile'); ?></label>
                        <input id="cost_per_mile" name="cost_per_mile" class="form-control styler" type="text" value="<?php echo e($drivers->cost_per_mile); ?>" />
                    </div>

                    <div class="form-group">
                        <label class="control-label" for="cost_per_mile_weekends"><?php echo app('translator')->get('main.drivers.field.cost_per_mile_weekends'); ?></label>
                        <input id="cost_per_mile_weekends" name="cost_per_mile_weekends" class="form-control styler" type="text" value="<?php echo e($drivers->cost_per_mile_weekends); ?>" />
                    </div>

                    <div class="form-group">
                        <label class="control-label" for="cost_per_mile_out_of_hours"><?php echo app('translator')->get('main.drivers.field.cost_per_mile_out_of_hours'); ?></label>
                        <input id="cost_per_mile_out_of_hours" name="cost_per_mile_out_of_hours" class="form-control styler" type="text" value="<?php echo e($drivers->cost_per_mile_out_of_hours); ?>" />
                    </div>

	                <div class="form-group">
                        <label class="control-label" for="driver_email"><?php echo app('translator')->get('main.drivers.field.driver_email'); ?></label>
	                     <input id="driver_email" name="driver_email" class="form-control styler" type="text" maxlength="50"  value="<?php echo e($drivers->driver_email); ?>" />
	                </div>

	                <div class="form-group">
                        <label class="control-label" for="driver_phone"><?php echo app('translator')->get('main.drivers.field.driver_phone'); ?></label>
	                     <input id="driver_phone" name="driver_phone" class="form-control styler" type="text" maxlength="50"  value="<?php echo e($drivers->driver_phone); ?>" />
	                </div>

                     <div class="form-group">
                        <label for="driver_address"><?php echo app('translator')->get('main.drivers.field.driver_address'); ?></label>
                        <input class="form-control styler" id="driver_address" name="driver_address" type="text" value="<?php echo e($drivers->driver_address); ?>">
                     </div>
                     <div class="form-group sr-only">
                        <label for="driver_others"><?php echo app('translator')->get('main.drivers.field.driver_others'); ?></label>
                        <textarea class="form-control styler" id="driver_others" name="driver_others" rows="7" style="height:200px;"><?php echo e($drivers->driver_others); ?></textarea>
                     </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-update" id="btnStatus">
                           <?php echo app('translator')->get('app.update.btn'); ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<?php $__env->stopSection(); ?>


<?php echo $__env->make('layouts.form', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/drivers/edit.blade.php ENDPATH**/ ?>