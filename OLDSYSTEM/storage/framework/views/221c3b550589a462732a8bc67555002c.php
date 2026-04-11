<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-admin.css')); ?>">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand"><?php echo app('translator')->get('main.storages.update'); ?></a>
                        <a href="javascript:viod(0)" class="btn btn-info btn-sm" onclick="viewAll('<?php echo e(route('storages.index')); ?>')"><i class="fa fa-reply"></i> <?php echo app('translator')->get('app.goback'); ?></a>
                    </nav>
                </div>
                <div class="card-body">
                    <div class="hts-flash"></div>
                    <form action="<?php echo e(route('storages.update',['id'=>$storages->id])); ?>" method="post" id="hezecomform" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
                        <?php echo e(csrf_field()); ?>

                        <input type="hidden" name="id" value="<?php echo e($storages->id); ?>">
                        <div class="form-group">
                            <label class="control-label" for="imei">IMEI</label>
                            <input id="imei" name="imei" class="form-control styler" type="text" maxlength="100"  value="<?php echo e($storages->imei); ?>" />
                        </div>
                        <div class="form-group">
                            <label class="control-label" for="unit_number"><?php echo app('translator')->get('main.storages.field.unit_number'); ?></label>
                            <input id="unit_number" name="unit_number" class="form-control styler" type="text" maxlength="100"  value="<?php echo e($storages->unit_number); ?>" />
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="unit_size"><?php echo app('translator')->get('main.storages.field.unit_size'); ?></label>
                            <input id="unit_size" name="unit_size" class="form-control styler" type="text" maxlength="100"  value="<?php echo e($storages->unit_size); ?>" />
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="availability"><?php echo app('translator')->get('main.storages.field.availability'); ?></label>
                            <select name="availability" id="availability" class="form-control styler">
                                <option value="<?php echo e($storages->availability); ?>"><?php echo e($storages->availability); ?></option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="unit_type"><?php echo app('translator')->get('main.storages.field.unit_type'); ?></label>
                            <select name="unit_type" id="unit_type" class="form-control styler">
                                <option value="<?php echo e($storages->unit_type); ?>"><?php echo e($storages->unit_type); ?></option>
                                <option value="Chill">Chill</option>
                                <option value="Ambient">Ambient</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="control-label" for="calibration_date"><?php echo app('translator')->get('main.storages.field.calibration_date'); ?></label>
                            <input id="calibration_date" name="calibration_date" type="text" class="date2 form-control styler" value="<?php echo e(\Illuminate\Support\Carbon::parse($storages->calibration_date)->format('d-m-Y')); ?>" />
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-update" id="btnStatus">
                                Update
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

<?php $__env->stopSection(); ?>


<?php echo $__env->make('layouts.form', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/storages/edit.blade.php ENDPATH**/ ?>