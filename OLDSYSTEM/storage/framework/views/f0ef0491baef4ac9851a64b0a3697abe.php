
<div class="modal fade" id="customerModalRates" tabindex="-1" role="dialog"
     aria-labelledby="customerModalRatesTitle" aria-hidden="true">
    <form action="<?php echo e(route('customervehiclerates.store')); ?>" method="post" id="hezecomformRates" name="hezecomform">
        <?php echo e(csrf_field()); ?>

        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="customerModalRatesTitle"><?php if($customers): ?> <?php echo e($customers->customer); ?>

                        Rates <?php endif; ?></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body pb-0">
                    <div class="hts-flash"></div>
                    <div class="table-responsive">
                        <div class="col col-md-12">
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
                                                    <input name="customer" value="<?php echo e($customers->customer_id); ?>" type="hidden"/>
                                                    <input name="vehicle_id[]" value="<?php echo e($vehicle->id); ?>" type="hidden"/>
                                                    <input type="text" name="rate[]" placeholder="pence/mile" value="<?php echo e($existingRate ? $existingRate->rate_per_mile : ''); ?>"/>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if(count($vehicles)>0): ?>
                                                    <input type="text" name="rate_weekend[]" placeholder="pence/mile weekend" value="<?php echo e($existingRate ? $existingRate->rate_per_mile_weekends : ''); ?>"/>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if(count($vehicles)>0): ?>
                                                    <input name="rate_out_of_hours[]" type="text" placeholder="pence/mile out of hours" value="<?php echo e($existingRate ? $existingRate->rate_per_mile_out_of_hours : ''); ?>"/>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="javascript:void(0)" class="btn btn-default" data-dismiss="modal">Go Back</a>
                    <button type="submit" class="btn btn-info" name="btn-save">
                        <i class="fa fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    </form>
</div><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/customervehiclerates/rates.blade.php ENDPATH**/ ?>