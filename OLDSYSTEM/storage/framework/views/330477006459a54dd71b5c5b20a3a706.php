
<?php if(count($addresses)>0): ?>
    <?php $__currentLoopData = $addresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key=>$value): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php
            $num=$key+1;
        ?>
        <div class="col-lg-4 col-md-4 col-sm-6 mb-1">
            <div class="card">
                <div class="card-header bg-success p-0" id="heading-<?php echo e($num); ?>">
                    <button class="btn btn-link text-white pb-1 pt-1" style="font-size: 14px;" type="button" data-toggle="collapse" data-target="#collapse-<?php echo e($num); ?>" aria-expanded="true" aria-controls="collapse-<?php echo e($num); ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <?php echo e($value->via_type); ?> Address (edit) <?php echo e($num); ?>

                    </button>
                </div>
                
                <div id="collapse-<?php echo e($num); ?>" class="" aria-labelledby="heading-<?php echo e($num); ?>" data-parent="#accordionExample">
                    <div class="card-body">

                        <input type="hidden" name="pod_verify-<?php echo e($num); ?>[]" value="1">
                        <input name="id-<?php echo e($num); ?>[]" type="hidden" value="<?php echo e($value->via_id); ?>">

                        
                        <div class="card">
                            <div class="card-header bg-primary text-white pt-1 pb-1" style="font-size:.8rem;">✅ POD Information</div>
                            <div class="card-body pt-2 pb-0">
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">Signed By</span>
                                        <label class="booking-label sr-only" for="signed_by-<?php echo e($num); ?>">Signed By</label>
                                        <input id="signed_by-<?php echo e($num); ?>" name="signed_by-<?php echo e($num); ?>[]" class="booking-input styler" type="text" placeholder="Signed By" value="<?php echo e($value->signed_by); ?>" />
                                    </div>
                                </div>
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Date</span>
                                            <label class="booking-label sr-only" for="pod_date-<?php echo e($num); ?>">Date</label>
                                            <input id="pod_date-<?php echo e($num); ?>" name="pod_date-<?php echo e($num); ?>[]" class="date1 booking-input styler" type="text" placeholder="Date" value="<?php if($value->date): ?><?php echo e(\Carbon\Carbon::parse($value->date)->format('d-m-Y')); ?><?php endif; ?>" />
                                        </div>
                                    </div>
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Time</span>
                                            <label class="booking-label sr-only" for="pod_time-<?php echo e($num); ?>">Time</label>
                                            <input id="pod_time-<?php echo e($num); ?>" name="pod_time-<?php echo e($num); ?>[]" class="timepicker2 booking-input styler" type="text" placeholder="Time" value="<?php if($value->time): ?><?php echo e($value->time); ?><?php endif; ?>" />
                                        </div>
                                    </div>
                                </div>
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">🌡 Temp</span>
                                        <label class="booking-label sr-only" for="delivered_temperature-<?php echo e($num); ?>">Delivered Temperature</label>
                                        <input id="delivered_temperature-<?php echo e($num); ?>" name="delivered_temperature-<?php echo e($num); ?>[]" class="booking-input styler" type="text" placeholder="Delivered Temperature" value="<?php echo e($value->delivered_temperature); ?>" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php endif; ?>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/viaaddress/formEditPOD.blade.php ENDPATH**/ ?>