<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.booking.title'); ?>
<?php $__env->stopSection(); ?>
<?php $__env->startSection('content'); ?>

<?php
    $customervehiclerates = isset($customervehiclerates) ? $customervehiclerates : null;
?>


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
    <form action="<?php echo e(route('customervehiclerates.store')); ?>" method="post" id="hezecomform" name="hezecomform">
        <?php echo e(csrf_field()); ?>

        <div class="row mb-2 viewDetails">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <nav class="nav  justify-content-between">
                            <a class="navbar-brand">Customer (<small><?php echo e($customers->customer); ?></small>)</a>
                            <div class="btn-group">
                                <a href="<?php echo e(route('customers.index')); ?>" class="btn btn-info btn-sm"><i class="fa fa-reply"></i> <?php echo app('translator')->get('app.goback'); ?></a>
                            </div>
                        </nav>
                    </div>
                    <div class="card-body pb-lg-1 pb-sm-5">
                        <div class="row">
                            <div class="col col-md-6">
                                <ul class="list-group">

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.user_id'); ?></span>
                                        <p><?php echo e($customers->username); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.customer'); ?></span>
                                        <p><?php echo e($customers->customer); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.email'); ?></span>
                                        <p><?php echo e($customers->email); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.phone'); ?></span>
                                        <p><?php echo e($customers->phone); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.address'); ?></span>
                                        <p><?php echo $customers->address; ?></p>
                                        <p><?php echo $customers->address2; ?></p>
                                        <p><?php echo $customers->address3; ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.city'); ?></span>
                                        <p><?php echo e($customers->city); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.postcode'); ?></span>
                                        <p><?php echo e($customers->postcode); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.po_number'); ?></span>
                                        <p><?php echo e($customers->po_number); ?></p>
                                    </li>
                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.po_email'); ?></span>
                                        <p><?php echo e($customers->po_email); ?></p>
                                    </li>
                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.contact'); ?></span>
                                        <p><?php echo e($customers->contact); ?></p>
                                    </li>
                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.dead_mileage'); ?></span>
                                        <p><?php echo e($customers->dead_mileage); ?></p>
                                    </li>

                                    <li class="list-group-item">
                                        <span><?php echo app('translator')->get('main.customers.field.notes'); ?></span>
                                        <p><?php echo $customers->notes; ?></p>
                                    </li>
                                </ul>
                            </div>
                            <div class="col col-md-6">
                                <div class="hts-flash"></div>
                                <h5 class="card-title font-weight-light pt-3">Choose Vehicles & Rates for this Customer</h5>
                                <div class="table-responsive card">
                                    <table class="table center-aligned-table">
                                        <thead>
                                        <tr class="text-primary">
                                            <th width="30%">Vehicle</th>
                                            <th width="23%">Normal Rate</th>
                                            <th width="23%">Weekend / Bank Holiday Rate</th>
                                            <th width="24%">Out Of Hours Rate</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <?php $__currentLoopData = $vehicles; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $vehicle): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                            <?php
                                                $existingRate = \App\Models\Customervehiclerates::where('vehicle_id', $vehicle->id)
                                                    ->where('customer_id', $customers->customer_id)
                                                    ->first();
                                            ?>
                                            <tr>
                                                <td><?php echo e($vehicle->name); ?></td>
                                                <td>
                                                    <?php if(count($vehicles)>0): ?>
                                                        <input name="customer" value="<?php echo e($customers->customer_id); ?>" type="hidden" />
                                                        <input name="vehicle_id[]" value="<?php echo e($vehicle->id); ?>" type="hidden" />
                                                        <input name="rate[]" type="text" placeholder="pence/mile" value="<?php echo e($existingRate ? $existingRate->rate_per_mile : ''); ?>" />
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if(count($vehicles)>0): ?>
                                                        <input name="rate_weekend[]" type="text" placeholder="pence/mile weekend" value="<?php echo e($existingRate ? $existingRate->rate_per_mile_weekends : ''); ?>" />
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if(count($vehicles)>0): ?>
                                                        <input name="rate_out_of_hours[]" type="text" placeholder="pence/mile out of hours" value="<?php echo e($existingRate ? $existingRate->rate_per_mile_out_of_hours : ''); ?>" />
                                                    <?php endif; ?>
                                                </td>
                                            </tr>
                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="row">
                                    <div class="col-md-12 text-right pr-4">
                                        <button type="submit" class="btn btn-info" name="btn-save">
                                            Update Rates
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </form>
<?php $__env->stopSection(); ?>
        

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/customers/details.blade.php ENDPATH**/ ?>