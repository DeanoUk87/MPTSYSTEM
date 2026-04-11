
<?php if(count($addresses)>0): ?>
    <?php $__currentLoopData = $addresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key=>$value): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php
            $num=$key+1;
        ?>
        <div class="col-lg-4 col-md-4 col-sm-6 mb-1">
            <div class="card">
                <div class="card-header bg-success p-0" id="heading-<?php echo e($num); ?>">
                    <button class="btn btn-link text-white pb-1 pt-1" style="font-size: 14px;" type="button" data-toggle="collapse" data-target="#collapse-<?php echo e($num); ?>" aria-expanded="false" aria-controls="collapse-<?php echo e($num); ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <?php echo e($value->via_type); ?> Address (edit) <?php echo e($num); ?>

                    </button>
                </div>
                
                <div id="collapse-<?php echo e($num); ?>" class="collapse" aria-labelledby="heading-<?php echo e($num); ?>" data-parent="#accordionExample">
                    <div class="card-body">

                        <p class="pull-right">
                            <a href="<?php echo e(route('viaaddress.delete2',$value->via_id)); ?>" class="booking-btn booking-btn-danger booking-btn-xs" onclick="return confirm('Are you sure you want to remove the via, If you wish to only change address then use postcode search')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                Remove
                            </a>
                        </p>

                        
                        <div class="booking-form-group">
                            <label class="booking-label sr-only" for="via_type-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.via_type'); ?></label>
                            <select class="booking-select styler" id="via_type-<?php echo e($num); ?>" name="via_type-<?php echo e($num); ?>[]">
                                <option value="<?php echo e($value->via_type); ?>"><?php echo e($value->via_type); ?></option>
                                <option value="Collection">Collection</option>
                                <option value="Delivery">Delivery</option>
                            </select>
                        </div>

                        <input name="id-<?php echo e($num); ?>[]" type="hidden" value="<?php echo e($value->via_id); ?>">

                        
                        <div class="booking-form-group">
                            <input name="search-<?php echo e($num); ?>" id="search-<?php echo e($num); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.booking.field.search'); ?>" autocomplete="off"/>
                        </div>

                        
                        <div class="booking-form-group">
                            <label class="booking-label sr-only" for="nameAutocomplete-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.name'); ?></label>
                            <input id="nameAutocomplete-<?php echo e($num); ?>" name="name-<?php echo e($num); ?>[]" value="<?php echo e($value->name); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.name'); ?>" />
                        </div>

                        
                        <div class="booking-row-2">
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="address1-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.address1'); ?></label>
                                <input id="address1-<?php echo e($num); ?>" name="address1-<?php echo e($num); ?>[]" value="<?php echo e($value->address1); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.address1'); ?>"/>
                            </div>
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="address2-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.address2'); ?></label>
                                <input id="address2-<?php echo e($num); ?>" name="address2-<?php echo e($num); ?>[]" value="<?php echo e($value->address2); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.address2'); ?>" />
                            </div>
                        </div>

                        
                        <div class="booking-row-2">
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="area-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.area'); ?></label>
                                <input id="area-<?php echo e($num); ?>" name="area-<?php echo e($num); ?>[]" value="<?php echo e($value->area); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.area'); ?>"/>
                            </div>
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="postcode-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.postcode'); ?></label>
                                <input id="postcode-<?php echo e($num); ?>" name="postcode-<?php echo e($num); ?>[]" value="<?php echo e($value->postcode); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.postcode'); ?>" />
                            </div>
                        </div>

                        
                        <input id="country-<?php echo e($num); ?>" name="country-<?php echo e($num); ?>[]" type="hidden" value="<?php echo e($value->country); ?>">

                        
                        <div class="booking-row-2">
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="contact-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.contact'); ?></label>
                                <input id="contact-<?php echo e($num); ?>" name="contact-<?php echo e($num); ?>[]" value="<?php echo e($value->contact); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.contact'); ?>"/>
                            </div>
                            <div class="booking-form-group">
                                <label class="booking-label sr-only" for="phone-<?php echo e($num); ?>"><?php echo app('translator')->get('main.viaaddress.field.phone'); ?></label>
                                <input id="phone-<?php echo e($num); ?>" name="phone-<?php echo e($num); ?>[]" value="<?php echo e($value->phone); ?>" class="booking-input styler" type="text" placeholder="<?php echo app('translator')->get('main.viaaddress.field.phone'); ?>" />
                            </div>
                        </div>

                        
                        <div class="booking-form-group">
                            <button type="button"
                                    class="booking-btn booking-btn-outline booking-btn-sm"
                                    data-toggle="collapse"
                                    data-target="#collectedOrders-<?php echo e($num); ?>"
                                    aria-expanded="false"
                                    aria-controls="collectedOrders-<?php echo e($num); ?>">
                                + Show Collected Orders
                            </button>
                        </div>
                        <div class="collapse mt-2" id="collectedOrders-<?php echo e($num); ?>">
                            <?php echo $__env->make('admin.collectedorders.via', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                        </div>

                        
                        <div class="booking-form-group">
                            <label for="notes-<?php echo e($num); ?>" class="booking-label sr-only"><?php echo app('translator')->get('main.viaaddress.field.notes'); ?></label>
                            <textarea class="booking-textarea styler" id="notes-<?php echo e($num); ?>" name="notes-<?php echo e($num); ?>[]" placeholder="<?php echo app('translator')->get('main.viaaddress.field.notes'); ?>" rows="3"><?php echo $value->notes; ?></textarea>
                        </div>

                        
                        <div class="card">
                            <div class="card-header bg-primary text-white pt-1 pb-1" style="font-size:.8rem;">📅 Via Date / Time</div>
                            <div class="card-body pt-2 pb-0">
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Date</span>
                                            <label class="booking-label sr-only" for="via_date-<?php echo e($num); ?>">Date</label>
                                            <input id="via_date-<?php echo e($num); ?>" name="via_date-<?php echo e($num); ?>[]" class="date1 booking-input styler" type="text" placeholder="Date" value="<?php if($value->via_date): ?><?php echo e(\Carbon\Carbon::parse($value->via_date)->format('d-m-Y')); ?><?php endif; ?>" />
                                        </div>
                                    </div>
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Time</span>
                                            <label class="booking-label sr-only" for="via_time-<?php echo e($num); ?>">Time</label>
                                            <input id="via_time-<?php echo e($num); ?>" name="via_time-<?php echo e($num); ?>[]" class="timepicker2 booking-input styler" type="text" placeholder="Time" value="<?php if($value->via_time): ?><?php echo e($value->via_time); ?><?php endif; ?>" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <?php if($value->via_pod_data_verify): ?>
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
                                                <input id="pod_time-<?php echo e($num); ?>" name="pod_time-<?php echo e($num); ?>[]" class="timepicker2 booking-input styler" type="text" placeholder="Time" value="<?php echo e($value->time); ?>" />
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
                        <?php else: ?>
                            <p class="text-center pt-3 lead">POD information uploaded but waiting for approval</p>
                            <p class="text-center">
                                <a href="<?php echo e(route('booking.edit.pod',$value->job_ref)); ?>" class="booking-btn booking-btn-danger booking-btn-lg">Click here to Approve</a>
                            </p>
                        <?php endif; ?>

                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php endif; ?>

<?php if ($__env->exists('admin.viaaddress.form')) echo $__env->make('admin.viaaddress.form', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/viaaddress/formEdit.blade.php ENDPATH**/ ?>