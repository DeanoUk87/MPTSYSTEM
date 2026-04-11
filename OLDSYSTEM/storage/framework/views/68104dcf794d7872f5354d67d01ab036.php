<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.booking.title'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-create.css')); ?>">
<style>
    .booking-toggle { position: relative; margin: 0; }
    .booking-toggle .form-check-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .booking-toggle .toggle-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        padding: 6px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #f8fafc;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.2;
        white-space: nowrap;
        transition: all .16s ease;
    }
    .booking-toggle .form-check-input:checked + .toggle-chip {
        background: #dcfce7;
        border-color: #16a34a;
        color: #166534;
    }
</style>

<div class="booking-page-wrapper">

    
    <?php if(session('success')): ?>
        <div class="booking-alert booking-alert-success">
            <span class="booking-alert-icon">✔</span>
            <span><?php echo e(session('success')); ?></span>
        </div>
    <?php endif; ?>
    <?php if(session('error')): ?>
        <div class="booking-alert booking-alert-danger">
            <span class="booking-alert-icon">✖</span>
            <span><?php echo e(session('error')); ?></span>
        </div>
    <?php endif; ?>

    <?php if($errors->any()): ?>
        <div class="booking-alert booking-alert-danger">
            <span class="booking-alert-icon">⚠</span>
            <ul>
                <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <li><?php echo e($error); ?></li>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </ul>
        </div>
    <?php endif; ?>

    <?php
        $jobType = (int) request()->input('weekend', 2);
    ?>

    <form action="<?php echo e(route('booking.store')); ?>" method="post" id="" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
        <?php echo e(csrf_field()); ?>

        <input type="hidden" name="weekend" value="<?php echo e($jobType); ?>">

        
        <div class="booking-main-card">

            
            <div class="booking-header">
                <h1 class="booking-header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <?php echo app('translator')->get('main.booking.create'); ?>
                    <?php if($customer): ?> &mdash; <?php echo e($customer); ?> <?php endif; ?>
                    <?php if($jobType === 1): ?>
                        <span class="weekend-badge">⚡ Weekend / Bank Holiday</span>
                    <?php elseif($jobType === 3): ?>
                        <span class="weekend-badge">🌙 Out Of Hours</span>
                    <?php endif; ?>
                </h1>
            </div>

            
            <div style="padding: 1.25rem;">
                <div class="hts-flash"></div>

                
                <div class="row mb-3">

                    
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="booking-section">
                            <div class="booking-section-header header-blue">
                                <span class="section-icon">👤</span>
                                <?php echo app('translator')->get('main.booking.field.customer'); ?>
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-form-group">
                                    <div class="d-flex align-items-center gap-2 flex-wrap">
                                        <?php if($customer): ?>
                                            <input id="customersAutocomplete1"
                                                   value="<?php echo e($customer); ?>"
                                                   class="booking-input"
                                                   type="text"
                                                   placeholder="Customer Name"
                                                   style="flex:1; min-width:0;"/>
                                        <?php else: ?>
                                            <input id="customersAutocomplete1"
                                                   class="booking-input"
                                                   type="text"
                                                   placeholder="Customer Name"
                                                   style="flex:1; min-width:0;"/>
                                        <?php endif; ?>

                                        <?php if($customer && $customers->notes): ?>
                                            <button type="button"
                                                    id="toggleNotesBtn"
                                                    onclick="toggleCustomerNotes()"
                                                    class="booking-btn booking-btn-danger booking-btn-sm">
                                                ⚠ View Notes
                                            </button>
                                        <?php endif; ?>
                                    </div>

                                    
                                    <input id="customer_id"
                                           name="customer"
                                           value="<?php echo e($id); ?>"
                                           type="hidden" />

                                    
                                    <?php if($customer && $customers->notes): ?>
                                        <div id="customerNotesContainer" class="customer-notes-panel">
                                            <?php echo $customers->notes; ?>

                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="booking-section">
                            <div class="booking-section-header header-blue">
                                <span class="section-icon">📋</span>
                                <?php echo app('translator')->get('main.booking.field.purchase_order'); ?>
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="purchase_order"><?php echo app('translator')->get('main.booking.field.purchase_order'); ?></label>
                                        <input id="purchase_order"
                                               name="purchase_order"
                                               type="text"
                                               class="booking-input styler"
                                               value="<?php echo e(old('purchase_order')); ?>"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.purchase_order'); ?>"
                                               required />
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="booked_by">Booked By</label>
                                        <input id="booked_by"
                                               name="booked_by"
                                               type="text"
                                               class="booking-input styler"
                                               value="<?php echo e(old('booked_by')); ?>"
                                               placeholder="Booked By" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <?php if($customer && request()->input('weekend')): ?>

                    
                    <div class="row">

                        
                        <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                            
                            <div class="booking-section">
                                <div class="booking-section-header">
                                    <span class="section-icon">📅</span>
                                    Collection Date / Time
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_date"><?php echo app('translator')->get('main.booking.field.collection_date'); ?></label>
                                            <input id="collection_date"
                                                   name="collection_date"
                                                   type="text"
                                                   class="booking-input styler date1"
                                                   value="<?php echo e(old('collection_date')); ?>"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_date'); ?>" />
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_time"><?php echo app('translator')->get('main.booking.field.collection_time'); ?></label>
                                            <input id="collection_time"
                                                   name="collection_time"
                                                   type="text"
                                                   class="booking-input styler timepicker2"
                                                   value="<?php echo e(old('collection_time')); ?>"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_time'); ?>" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header">
                                    <span class="section-icon">📦</span>
                                    Collection Details
                                </div>
                                <div class="booking-section-body">

                                    <div class="booking-form-group">
                                        <input name="collection_search" id="collection_search"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.search'); ?>"
                                               autocomplete="off"/>
                                    </div>

                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_name"><?php echo app('translator')->get('main.booking.field.collection_name'); ?></label>
                                        <input id="collectionAutocomplete"
                                               name="collection_name"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.collection_name'); ?>"
                                               value="<?php echo e(old('collection_name', ($customer && request()->input('weekend') && $customers) ? $customers->customer : '')); ?>"
                                               autocomplete="off"
                                               required/>
                                    </div>

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_address1"><?php echo app('translator')->get('main.booking.field.collection_address1'); ?></label>
                                            <input id="collection_address1"
                                                   name="collection_address1"
                                                   class="booking-input styler places-autocomplete"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_address1'); ?>"
                                                   value="<?php echo e(old('collection_address1', ($customer && request()->input('weekend') && $customers) ? $customers->address : '')); ?>"
                                                   required/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_address2"><?php echo app('translator')->get('main.booking.field.collection_address2'); ?></label>
                                            <input id="collection_address2"
                                                   name="collection_address2"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_address2'); ?>"
                                                   value="<?php echo e(old('collection_address2', ($customer && request()->input('weekend') && $customers) ? $customers->address2 : '')); ?>"/>
                                        </div>
                                    </div>

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_area"><?php echo app('translator')->get('main.booking.field.collection_area'); ?></label>
                                            <input id="collection_area"
                                                   name="collection_area"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_area'); ?>"
                                                   value="<?php echo e(old('collection_area', ($customer && request()->input('weekend') && $customers) ? $customers->city : '')); ?>"
                                                   required/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_postcode"><?php echo app('translator')->get('main.booking.field.collection_postcode'); ?></label>
                                            <input id="collection_postcode"
                                                   name="collection_postcode"
                                                   class="booking-input styler places-autocomplete"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.collection_postcode'); ?>"
                                                   value="<?php echo e(old('collection_postcode', ($customer && request()->input('weekend') && $customers) ? $customers->postcode : '')); ?>"/>
                                        </div>
                                    </div>

                                    <input id="collection_country"
                                           name="collection_country"
                                           type="hidden"
                                           value="<?php echo e(old('collection_country')); ?>">

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_contact"><?php echo app('translator')->get('main.booking.field.contact'); ?></label>
                                            <input id="collection_contact"
                                                   name="collection_contact"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.contact'); ?>"
                                                   value="<?php echo e(old('collection_contact')); ?>"
                                                   autocomplete="off"/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="collection_phone"><?php echo app('translator')->get('main.booking.field.phone'); ?></label>
                                            <input id="collection_phone"
                                                   name="collection_phone"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.phone'); ?>"
                                                   value="<?php echo e(old('collection_phone')); ?>"/>
                                        </div>
                                    </div>

                                    <div class="booking-form-group">
                                        <label for="collection_notes" class="booking-label sr-only"><?php echo app('translator')->get('main.booking.field.collection_notes'); ?></label>
                                        <textarea class="booking-textarea styler"
                                                  id="collection_notes"
                                                  name="collection_notes"
                                                  placeholder="<?php echo app('translator')->get('main.booking.field.collection_notes'); ?>"
                                                  rows="4"><?php echo e(old('collection_notes')); ?></textarea>
                                    </div>

                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header header-teal">
                                    <span class="section-icon">📎</span>
                                    POD Upload
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-form-group booking-file-upload">
                                        <label class="booking-label" for="fileupload"><?php echo app('translator')->get('app.multiupload'); ?></label>
                                        <input type="file" id="fileupload" value="" name="filename[]" class="styler"/>
                                        <span id="addVar" class="booking-btn booking-btn-success booking-btn-sm" style="align-self:flex-start;">
                                            + <?php echo app('translator')->get('app.addfield'); ?>
                                        </span>
                                    </div>
                                    <div class="booking-form-group">
                                        <textarea class="booking-textarea styler"
                                                  id="office_notes"
                                                  name="office_notes"
                                                  rows="5"
                                                  placeholder="<?php echo app('translator')->get('main.booking.field.office_notes'); ?>"><?php echo e(old('office_notes')); ?></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>

                        
                        <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                            <div class="booking-section">
                                <div class="booking-section-header header-purple">
                                    <span class="section-icon">🗺</span>
                                    Mileage Calculator
                                </div>
                                <div class="booking-section-body">

                                    <div class="booking-form-group">
                                        <div id="map"></div>
                                    </div>

                                    <?php if($customer): ?>
                                        <div class="booking-form-group">
                                            <div id="customerRates"></div>
                                            <div class="rates-action-row">
                                                <a href="javascript:void(0)" class="booking-btn booking-btn-info booking-btn-sm refreshRates">↻ Refresh</a>
                                                <a href="javascript:void(0)" class="booking-btn booking-btn-success booking-btn-sm" data-toggle="modal" data-target="#customerModalRates">+ Add Rates</a>
                                            </div>
                                        </div>

                                        <input id="vehicle_id" name="vehicle" value="<?php echo e(old('vehicle')); ?>" style="display:none" />

                                        <div class="booking-form-group">
                                            <div id="divRate" style="display:none">

                                                <div class="booking-form-group" style="display:none">
                                                    <label for="customer" class="booking-label text-center">Cost Per Mile</label>
                                                    <input name="perMile" id="vehicleRate" class="booking-input" value="<?php echo e(old('perMile')); ?>" type="text" readonly />
                                                </div>

                                                <div class="booking-form-group text-center">
                                                    <div id="directions-panel"></div>
                                                    <button type="button" id="submit" class="booking-btn booking-btn-danger w-100">
                                                        📍 Get Mileage and Costs
                                                    </button>
                                                </div>

                                                <div class="booking-form-group">
                                                    <div class="booking-input-group">
                                                        <span class="booking-input-addon">Miles</span>
                                                        <input id="miles" name="miles" value="<?php echo e(old('miles')); ?>" class="booking-input styler booking-cost-display text-info miles mileCost" type="text" placeholder="Enter Miles" />
                                                    </div>
                                                    <div class="text-center mt-2">
                                                        <span class="booking-label" id="totalTime" style="color:var(--warning);"></span>
                                                    </div>
                                                    <input name="time_covered" id="totalTimeVal" value="<?php echo e(old('time')); ?>" type="hidden" />
                                                </div>

                                                <div class="booking-form-group" style="<?php echo e($display); ?>">
                                                    <div class="booking-input-group">
                                                        <span class="booking-input-addon">Quote (<?php echo env('CURRENCY_SYMBOL'); ?>)</span>
                                                        <input id="cost" name="cost" value="<?php echo e((old('cost'))); ?>" class="booking-input styler booking-cost-display text-success totalCost costAdd" type="text" placeholder="Total Cost" />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    <?php endif; ?>

                                    
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Fuel Surcharge</span>
                                            <select name="fuel_surcharge_percent" id="fuelSurcharge" class="booking-select styler">
                                                <option value="0">None (Up to £1.70/litre)</option>
                                                <option value="6">£1.71 – £1.79/litre (+6p/mile)</option>
                                                <option value="9">£1.80 – £1.89/litre (+9p/mile)</option>
                                                <option value="12">£1.90+/litre (+12p/mile)</option>
                                            </select>
                                        </div>
                                        <input class="fuel_surcharge_cost" name="fuel_surcharge_cost" style="display:none"/>
                                    </div>

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <input name="number_of_items" id="number_of_items" class="booking-input styler" value="<?php echo e(old('number_of_items')); ?>" type="text" placeholder="No. of Items" required />
                                        </div>
                                        <div class="booking-form-group">
                                            <input name="weight" id="weight" class="booking-input styler" value="<?php echo e(old('weight')); ?>" type="text" placeholder="Weight (kg)" required />
                                        </div>
                                    </div>

                                    <div class="booking-form-group">
                                        <select name="booking_type" id="booking_type" class="booking-select">
                                            <?php $__currentLoopData = $types; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $type): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                <option value="<?php echo e($type->type_name); ?>"><?php echo e($type->type_name); ?></option>
                                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                        </select>
                                    </div>

                                    <div class="booking-row-2" style="<?php echo e($display); ?>">
                                        <div class="booking-form-group">
                                            <input name="manual_desc" class="booking-input styler" value="<?php echo e(old('manual_desc')); ?>" type="text" min="0" placeholder="Manual Job" />
                                        </div>
                                        <div class="booking-form-group">
                                            <input name="manual_amount" id="manual" class="booking-input styler" value="<?php echo e(old('manual_amount')); ?>" type="text" min="0" placeholder="Amount" />
                                        </div>
                                    </div>

                                    <div class="booking-form-group text-center">
                                        <a href="#" class="booking-btn booking-btn-success booking-btn-sm similar" data-toggle="modal" data-target="#bookModalCenter" style="display:none;">
                                            🔍 View Similar Jobs
                                        </a>
                                    </div>

                                    <div class="booking-form-group avoid-tolls-row" style="display:grid; grid-template-columns:repeat(2,minmax(210px,1fr)); gap:8px 14px; align-items:center; justify-items:start; max-width:560px; margin:0 auto;">
                                        <label class="booking-check booking-toggle">
                                            <input class="form-check-input" type="checkbox" name="avoid_tolls" value="1" id="avoidTolls" <?php if(old('avoid_tolls', 1)): ?> checked <?php endif; ?>>
                                            <span class="toggle-chip">Avoid Tolls</span>
                                        </label>
                                        <label class="booking-check booking-toggle">
                                            <input class="form-check-input" type="checkbox" name="new_mileage" value="1" id="new_mileage" <?php if(old('new_mileage')): ?> checked <?php endif; ?>>
                                            <span class="toggle-chip">Apply New Mileage &amp; Cost</span>
                                        </label>
                                        <label class="booking-check booking-toggle">
                                            <input class="form-check-input" type="checkbox" name="wait_and_return" value="1" id="waitReturn" <?php if(old('wait_and_return')): ?> checked <?php endif; ?>>
                                            <span class="toggle-chip">Wait and Return</span>
                                        </label>
                                        <?php if($customers->dead_mileage): ?>
                                            <input name="dead_mileage" id="dead_mileage" value="<?php echo e($customers->dead_mileage); ?>" style="display:none">
                                            <label class="booking-check booking-toggle">
                                                <input class="form-check-input" type="checkbox" name="dead_mileage_status" value="1" id="deadMileage" <?php if(old('dead_mileage_status')): ?> checked <?php endif; ?>>
                                                <span class="toggle-chip">Dead Mileage (<?php echo e($customers->dead_mileage); ?> miles)</span>
                                            </label>
                                        <?php endif; ?>
                                    </div>

                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header header-green">
                                    <span class="section-icon">💰</span>
                                    Profit &amp; Notes
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-form-group" style="<?php echo e($display); ?>">
                                        <div class="booking-input-group profit-row" style="border:none; padding:0; background:transparent;">
                                            <div class="booking-input-group">
                                                <span class="booking-input-addon" style="background:var(--success-light); color:var(--success); font-weight:700;">PROFIT <?php echo env('CURRENCY_SYMBOL'); ?></span>
                                                <input id="profit" name="profit" value="<?php echo e(old('profit')); ?>" type="text" class="booking-input booking-cost-display text-success text-center" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="booking-form-group">
                                        <label for="job_notes" class="booking-label sr-only">Job Notes</label>
                                        <textarea class="booking-textarea styler" id="job_notes" name="job_notes" placeholder="Job Notes" rows="4"><?php echo e(old('job_notes')); ?></textarea>
                                    </div>
                                </div>
                            </div>

                        </div>

                        
                        <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                            
                            <div class="booking-section">
                                <div class="booking-section-header">
                                    <span class="section-icon">📅</span>
                                    Delivery Date / Time
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_date"><?php echo app('translator')->get('main.booking.field.delivery_date'); ?></label>
                                            <input id="delivery_date"
                                                   name="delivery_date"
                                                   type="text"
                                                   class="booking-input styler date1"
                                                   value="<?php echo e(old('delivery_date')); ?>"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_date'); ?>" />
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_time"><?php echo app('translator')->get('main.booking.field.delivery_time'); ?></label>
                                            <input id="delivery_time"
                                                   name="delivery_time"
                                                   type="text"
                                                   class="booking-input styler timepicker2"
                                                   value="<?php echo e(old('delivery_time')); ?>"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_time'); ?>" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header">
                                    <span class="section-icon">🏠</span>
                                    Delivery Address
                                </div>
                                <div class="booking-section-body">

                                    <div class="booking-form-group">
                                        <input id="delivery_search" name="delivery_search"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.search'); ?>"
                                               autocomplete="off" />
                                    </div>

                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_name"><?php echo app('translator')->get('main.booking.field.delivery_name'); ?></label>
                                        <input id="deliveryAutocomplete"
                                               name="delivery_name"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.delivery_name'); ?>"
                                               value="<?php echo e(old('delivery_name')); ?>"
                                               autocomplete="off"
                                               required/>
                                    </div>

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_address1"><?php echo app('translator')->get('main.booking.field.delivery_address1'); ?></label>
                                            <input id="delivery_address1"
                                                   name="delivery_address1"
                                                   class="booking-input styler places-autocomplete2"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_address1'); ?>"
                                                   value="<?php echo e(old('delivery_address1')); ?>"
                                                   required/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_address2"><?php echo app('translator')->get('main.booking.field.delivery_address2'); ?></label>
                                            <input id="delivery_address2"
                                                   name="delivery_address2"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_address2'); ?>"
                                                   value="<?php echo e(old('delivery_address2')); ?>"/>
                                        </div>
                                    </div>

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_area"><?php echo app('translator')->get('main.booking.field.delivery_area'); ?></label>
                                            <input id="delivery_area"
                                                   name="delivery_area"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_area'); ?>"
                                                   value="<?php echo e(old('delivery_area')); ?>"
                                                   required/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_postcode"><?php echo app('translator')->get('main.booking.field.delivery_postcode'); ?></label>
                                            <input id="delivery_postcode"
                                                   name="delivery_postcode"
                                                   class="booking-input styler places-autocomplete2"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.delivery_postcode'); ?>"
                                                   value="<?php echo e(old('delivery_postcode')); ?>"/>
                                        </div>
                                    </div>

                                    <input id="delivery_country"
                                           name="delivery_country"
                                           type="hidden"
                                           value="<?php echo e(old('delivery_country')); ?>">

                                    <div class="booking-row-2">
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_contact"><?php echo app('translator')->get('main.booking.field.contact'); ?></label>
                                            <input id="delivery_contact"
                                                   name="delivery_contact"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.contact'); ?>"
                                                   value="<?php echo e(old('delivery_contact')); ?>"
                                                   autocomplete="off"/>
                                        </div>
                                        <div class="booking-form-group">
                                            <label class="booking-label sr-only" for="delivery_phone"><?php echo app('translator')->get('main.booking.field.phone'); ?></label>
                                            <input id="delivery_phone"
                                                   name="delivery_phone"
                                                   class="booking-input styler"
                                                   type="text"
                                                   placeholder="<?php echo app('translator')->get('main.booking.field.phone'); ?>"
                                                   value="<?php echo e(old('delivery_phone')); ?>"/>
                                        </div>
                                    </div>

                                    
                                    <?php if(isset($customer)): ?>
                                    <div class="booking-form-group" style="margin-top:.75rem;">
                                        <?php echo $__env->make('admin.collectedorders.main', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                                    </div>
                                    <?php endif; ?>

                                    <div class="booking-form-group">
                                        <label for="delivery_notes" class="booking-label sr-only"><?php echo app('translator')->get('main.booking.field.delivery_notes'); ?></label>
                                        <textarea class="booking-textarea styler"
                                                  id="delivery_notes"
                                                  name="delivery_notes"
                                                  placeholder="<?php echo app('translator')->get('main.booking.field.delivery_notes'); ?>"
                                                  rows="4"><?php echo e(old('delivery_notes')); ?></textarea>
                                    </div>

                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header header-danger">
                                    <span class="section-icon">🚗</span>
                                        <?php if($jobType === 1): ?>
                                        DRIVER COST (Weekend / Bank Holiday)
                                        <?php elseif($jobType === 3): ?>
                                            DRIVER COST (Out Of Hours)
                                    <?php else: ?>
                                        DRIVER COST
                                    <?php endif; ?>
                                </div>
                                <div class="booking-section-body" style="background: var(--purple-light);">

                                    
                                    <div class="booking-form-group">
                                        <div class="driver-row">
                                            <div class="booking-input-group" style="flex:1;">
                                                <span class="booking-input-addon">Driver</span>
                                                <select name="driverCost" id="driverCost" class="booking-select styler">
                                                    <option value="">Select Driver</option>
                                                    <?php if($jobType === 1): ?>
                                                        <?php $__currentLoopData = $drivers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $driver): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($driver->cost_per_mile_weekends); ?>|<?php echo e($driver->driver_id); ?>"><?php echo e($driver->driver); ?> = <?php echo e($driver->cost_per_mile_weekends); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php elseif($jobType === 3): ?>
                                                        <?php $__currentLoopData = $drivers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $driver): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($driver->cost_per_mile_out_of_hours); ?>|<?php echo e($driver->driver_id); ?>"><?php echo e($driver->driver); ?> = <?php echo e($driver->cost_per_mile_out_of_hours); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php else: ?>
                                                        <?php $__currentLoopData = $drivers; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $driver): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($driver->cost_per_mile); ?>|<?php echo e($driver->driver_id); ?>"><?php echo e($driver->driver); ?> = <?php echo e($driver->cost_per_mile); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php endif; ?>
                                                </select>
                                            </div>
                                            <div class="booking-input-group driver-cost-group" style="<?php echo e($display); ?>">
                                                <span class="booking-input-addon"><?php echo env('CURRENCY_SYMBOL'); ?></span>
                                                <input id="driverTotal" name="driver_cost" class="booking-input booking-cost-display text-danger text-center driverTotal driver-cost-input" value="<?php echo e(old('driver_cost')); ?>"/>
                                            </div>
                                        </div>
                                        <input id="driverId" name="driver" value="<?php echo e(old('driver')); ?>" style="display:none" />
                                    </div>

                                    
                                    <div class="booking-form-group">
                                        <div class="driver-row">
                                            <div class="booking-input-group" style="flex:1;">
                                                <span class="booking-input-addon">SubCon</span>
                                                <select name="secondman" id="driverCost2" class="booking-select styler">
                                                    <option value="">Select Driver</option>
                                                    <?php if($jobType === 1): ?>
                                                        <?php $__currentLoopData = $secondMan; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $second): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($second->cost_per_mile_weekends); ?>|<?php echo e($second->driver_id); ?>"><?php echo e($second->driver); ?> = <?php echo e($second->cost_per_mile_weekends); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php elseif($jobType === 3): ?>
                                                        <?php $__currentLoopData = $secondMan; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $second): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <?php if($second->cost_per_mile_out_of_hours !== null && $second->cost_per_mile_out_of_hours !== ''): ?>
                                                                <option value="<?php echo e($second->cost_per_mile_out_of_hours); ?>|<?php echo e($second->driver_id); ?>"><?php echo e($second->driver); ?> = <?php echo e($second->cost_per_mile_out_of_hours); ?>/mile</option>
                                                            <?php endif; ?>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php else: ?>
                                                        <?php $__currentLoopData = $secondMan; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $second): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($second->cost_per_mile); ?>|<?php echo e($second->driver_id); ?>"><?php echo e($second->driver); ?> = <?php echo e($second->cost_per_mile); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php endif; ?>
                                                </select>
                                            </div>
                                            <div id="driverVal2" class="booking-input-group driver-cost-group" style="<?php echo e($display); ?>">
                                                <span class="booking-input-addon"><?php echo env('CURRENCY_SYMBOL'); ?></span>
                                                <input id="seconManCost" name="extra_cost" class="booking-input booking-cost-display text-danger text-center driver-cost-input" value="<?php echo e(old('extra_cost')); ?>" autocomplete="off"/>
                                            </div>
                                        </div>
                                        <input id="driverId2" name="second_man" value="<?php echo e(old('second_man')); ?>" style="display:none">
                                    </div>

                                    
                                    <div class="booking-form-group">
                                        <p id="driverContact"></p>
                                    </div>
                                    <div class="booking-form-group">
                                        <p id="unitStorage"></p>
                                    </div>

                                    
                                    <div class="booking-form-group">
                                        <div class="driver-row">
                                            <div class="booking-input-group" style="flex:1;">
                                                <span class="booking-input-addon">CX Driver</span>
                                                <select name="cx_driver" id="driverCost3" class="booking-select styler">
                                                    <option value="">Select CX Driver</option>
                                                    <?php if($jobType === 1): ?>
                                                        <?php $__currentLoopData = $cxDriver; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cx): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($cx->cost_per_mile_weekends); ?>|<?php echo e($cx->driver_id); ?>"><?php echo e($cx->driver); ?> = <?php echo e($cx->cost_per_mile_weekends); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php elseif($jobType === 3): ?>
                                                        <?php $__currentLoopData = $cxDriver; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cx): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($cx->cost_per_mile_out_of_hours); ?>|<?php echo e($cx->driver_id); ?>"><?php echo e($cx->driver); ?> = <?php echo e($cx->cost_per_mile_out_of_hours); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php else: ?>
                                                        <?php $__currentLoopData = $cxDriver; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cx): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                            <option value="<?php echo e($cx->cost_per_mile); ?>|<?php echo e($cx->driver_id); ?>"><?php echo e($cx->driver); ?> = <?php echo e($cx->cost_per_mile); ?>/mile</option>
                                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                                    <?php endif; ?>
                                                </select>
                                            </div>
                                            <div id="driverVal3" class="booking-input-group driver-cost-group" style="<?php echo e($display); ?>">
                                                <span class="booking-input-addon"><?php echo env('CURRENCY_SYMBOL'); ?></span>
                                                <input id="cxDriverCost" name="cxdriver_cost" class="booking-input booking-cost-display text-danger text-center driver-cost-input" value="<?php echo e(old('cxdriver_cost')); ?>" autocomplete="off"/>
                                            </div>
                                        </div>
                                        <input id="driverId3" name="cxdriver" value="<?php echo e(old('cxdriver')); ?>" style="display:none">
                                    </div>

                                    <?php if($customer): ?>
                                    <div class="booking-form-group">
                                        <div class="d-flex flex-nowrap align-items-stretch" style="gap:4px; width:100%;">
                                            <button type="button" class="btn btn-info btn-sm" onclick="openAllUnitsModal()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                                <i class="fa fa-list"></i> Show All Units
                                            </button>
                                            <button type="button" class="btn btn-warning btn-sm" id="toggleTempTrackingBtn" onclick="toggleTempTracking()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                                Turn Off Temp Tracking
                                            </button>
                                            <button type="button" class="btn btn-secondary btn-sm" id="toggleMapTrackingBtn" onclick="toggleMapTracking()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                                Turn Off Map
                                            </button>
                                        </div>
                                        <input type="hidden" id="hide_tracking_temperature" name="hide_tracking_temperature" value="<?php echo e(old('hide_tracking_temperature', '0')); ?>">
                                        <input type="hidden" id="hide_tracking_map" name="hide_tracking_map" value="<?php echo e(old('hide_tracking_map', '0')); ?>">
                                    </div>
                                    <?php endif; ?>

                                    
                                    <div class="row sr-only">
                                        <div class="col-md-7 col-xs-12">
                                            <div class="booking-form-group">
                                                <input name="extra_cost2_label" class="booking-input styler" placeholder="Extra Cost" />
                                            </div>
                                        </div>
                                        <div class="col-md-5 col-xs-12">
                                            <div class="booking-input-group">
                                                <span class="booking-input-addon"><?php echo env('CURRENCY_SYMBOL'); ?></span>
                                                <input id="extraCost" name="extra_cost2" class="booking-input booking-cost-display text-success text-center" value="<?php echo e(old('extra_cost2')); ?>" autocomplete="off"/>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            
                            <div class="booking-section">
                                <div class="booking-section-header header-teal">
                                    <span class="section-icon">✅</span>
                                    POD Details
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="pod_signature"><?php echo app('translator')->get('main.booking.field.pod_signature'); ?></label>
                                        <input id="pod_signature" name="pod_signature" class="booking-input styler" placeholder="<?php echo app('translator')->get('main.booking.field.pod_signature'); ?>" type="text" value="<?php echo e(old('pod_signature')); ?>"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="pod_date">Date</label>
                                        <input id="pod_date" name="pod_date" class="booking-input styler date1" placeholder="Date" type="text" value="<?php echo e(old('pod_date')); ?>"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="pod_time"><?php echo app('translator')->get('main.booking.field.pod_time'); ?></label>
                                        <input id="pod_time" name="pod_time" class="booking-input styler timepicker2" placeholder="<?php echo app('translator')->get('main.booking.field.pod_time'); ?>" type="text" value="<?php echo e(old('pod_time')); ?>"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">🌡 Temp</span>
                                            <label class="booking-label sr-only" for="delivered_temperature">Delivered Temperature</label>
                                            <input id="delivered_temperature" name="delivered_temperature" class="booking-input styler" type="text" maxlength="100" placeholder="Delivered Temperature" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                    
                    <div class="accordion" id="accordionExample">
                        <div class="row">
                            <?php if ($__env->exists('admin.viaaddress.form')) echo $__env->make('admin.viaaddress.form', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
                        </div>
                    </div>

                <?php endif; ?>

            </div>

        </div>

        
        <div class="booking-save-btn-wrapper">
            <?php if($customer): ?>
                <button type="submit" class="booking-btn-save" name="btn-save" id="btnStatus">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    <?php echo app('translator')->get('app.add.btn'); ?>
                </button>
            <?php endif; ?>
        </div>

    </form>

    
    <?php if($customer): ?>

        
        <div class="modal fade" id="bookModalCenter" tabindex="-1" role="dialog" aria-labelledby="bookModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="bookModalCenterTitle"><?php if($customer): ?> <?php echo e($customer); ?> Latest Jobs <?php endif; ?></h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body pb-0">
                        <div class="table-responsive">
                            <div id="similarJobs"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="modal fade" id="driverInfoModalCenter" tabindex="-1" role="dialog" aria-labelledby="driverInfoModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="driverInfoModalCenterTitle">Driver Contact Details</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body text-center">
                        <div id="driverContactInfo"></div>
                    </div>
                </div>
            </div>
        </div>

        
        <?php if ($__env->exists('admin.customervehiclerates.rates')) echo $__env->make('admin.customervehiclerates.rates', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

    <?php endif; ?>

    
    <?php if($customer): ?>
    <div class="modal fade" id="allUnitsModal" tabindex="-1" role="dialog" aria-labelledby="allUnitsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="allUnitsModalLabel">All Storage Units</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="padding:12px;">
                    <div id="allUnitsFlash"></div>

                    
                    <div id="allUnitsGrid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:50vh; overflow-y:auto;">
                        <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">Loading...</div>
                    </div>

                    
                    <div id="transferSection" style="display:none; margin-top:14px; border-top:1px solid #dee2e6; padding-top:12px;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <strong style="font-size:13px; white-space:nowrap;">Transfer to driver:</strong>
                            <input type="text" id="transferDriverSearch" class="form-control form-control-sm" placeholder="Search driver..." autocomplete="off" style="flex:1; min-width:180px;" />
                            <input type="hidden" id="transferDriverValue" />
                            <button type="button" class="btn btn-warning btn-sm" id="doTransferBtn">
                                <i class="fa fa-exchange"></i> Transfer Units
                            </button>
                        </div>
                        <label style="display:block; margin:8px 0 4px; font-size:12px; color:#444;">
                            <input type="checkbox" id="replaceExistingUnits" style="vertical-align:middle; margin-right:6px;">
                            Replace target driver's current units (keep only selected units)
                        </label>
                        <small class="text-muted" style="font-size:11px;">CX Drivers are not shown. Select units above then pick a driver.</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    
    <?php if($customer && !request()->input('weekend')): ?>
    <div class="modal fade" id="jobTypeModal" tabindex="-1" aria-labelledby="jobTypeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="jobTypeModalLabel">SELECT THE JOB TYPE</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <a href="<?php echo e(\Illuminate\Support\Facades\URL::current()); ?>?cust=<?php echo e(request()->input('cust')); ?>&weekend=2" class="btn btn-block btn-lg btn-primary">Normal</a>
                    <a href="<?php echo e(\Illuminate\Support\Facades\URL::current()); ?>?cust=<?php echo e(request()->input('cust')); ?>&weekend=1" class="btn btn-block btn-lg btn-danger">Weekend/Bank Holiday</a>
                    <a href="<?php echo e(\Illuminate\Support\Facades\URL::current()); ?>?cust=<?php echo e(request()->input('cust')); ?>&weekend=3" class="btn btn-block btn-lg btn-dark">Out Of Hours</a>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

</div>


<?php if($customer && $customers->notes): ?>
<script>
function toggleCustomerNotes() {
    var container = document.getElementById('customerNotesContainer');
    var button = document.getElementById('toggleNotesBtn');
    if (container.style.display === "none") {
        container.style.display = "block";
        button.textContent = "✖ Hide Notes";
    } else {
        container.style.display = "none";
        button.textContent = "⚠ View Notes";
    }
}
</script>
<?php endif; ?>



<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <?php echo $__env->make('partials.autocomplete', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php echo $__env->make('partials.bookingjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php echo $__env->make('partials.googleDirection', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php echo $__env->make('admin.collectedorders.js', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

<?php if($customer): ?>
<script>
/* ── All Units / Transfer Modal ── */
var allDriverContactsList = [];

function applyTrackingToggleLabels() {
    var tempHidden = $('#hide_tracking_temperature').val() === '1';
    var mapHidden  = $('#hide_tracking_map').val() === '1';

    $('#toggleTempTrackingBtn').text(tempHidden ? 'Turn On Temp Tracking' : 'Turn Off Temp Tracking');
    $('#toggleMapTrackingBtn').text(mapHidden ? 'Turn On Map' : 'Turn Off Map');
}

function toggleTempTracking() {
    var nextValue = $('#hide_tracking_temperature').val() === '1' ? '0' : '1';
    $('#hide_tracking_temperature').val(nextValue);
    applyTrackingToggleLabels();
}

function toggleMapTracking() {
    var nextValue = $('#hide_tracking_map').val() === '1' ? '0' : '1';
    $('#hide_tracking_map').val(nextValue);
    applyTrackingToggleLabels();
}

function openAllUnitsModal() {
    $('#allUnitsFlash').html('');
    $('#transferSection').hide();
    $('#transferDriverSearch').val('');
    $('#transferDriverValue').val('');
    $('#replaceExistingUnits').prop('checked', false);
    loadUnits();
    $('#allUnitsModal').modal('show');
}

function loadUnits() {
    $('#allUnitsGrid').html('<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">Loading...</div>');
    $.getJSON('<?php echo e(route('booking.units.all')); ?>?_=' + Date.now(), function(units) {
        if (!units || units.length === 0) {
            $('#allUnitsGrid').html('<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">No units found.</div>');
            return;
        }
        var html = '';
        units.forEach(function(u) {
            var badge = u.availability === 'Yes'
                ? '<span style="background:#c8e6c9;color:#2e7d32;padding:1px 6px;border-radius:3px;font-size:10px;">In Store</span>'
                : '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:3px;font-size:10px;">Out</span>';
            var driver = u.driver_label
                ? '<span style="color:#555;font-size:11px;">' + $('<div>').text(u.driver_label).html() + '</span>'
                : '<span style="color:#aaa;font-size:11px;">—</span>';
            html += '<label style="display:flex;align-items:center;gap:6px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;padding:6px 8px;cursor:pointer;font-size:12px;margin:0;">'
                + '<input type="checkbox" class="unit-check" value="' + u.id + '" style="margin:0;flex-shrink:0;" />'
                + '<span style="font-weight:600;">' + $('<div>').text(u.unit_number).html() + '</span>'
                + '<span style="color:#888;">(' + $('<div>').text(u.unit_size).html() + ')</span>'
                + badge
                + driver
                + '</label>';
        });
        $('#allUnitsGrid').html(html);

        // Show transfer section when any checkbox changes
        $('#allUnitsGrid').off('change.unitcheck').on('change.unitcheck', '.unit-check', function() {
            var anyChecked = $('#allUnitsGrid .unit-check:checked').length > 0;
            $('#transferSection').toggle(anyChecked);
            if (anyChecked && allDriverContactsList.length === 0) {
                loadContacts();
            }
        });
    });
}

function loadContacts() {
    $.getJSON('<?php echo e(route('booking.units.contacts')); ?>', function(data) {
        allDriverContactsList = data || [];
        if ($('#transferDriverSearch').autocomplete('instance')) {
            $('#transferDriverSearch').autocomplete('option', 'source', buildSource());
        }
    });
}

function buildSource() {
    return function(request, response) {
        var term = request.term.toLowerCase();
        var filtered = allDriverContactsList.filter(function(c) {
            return c.label.toLowerCase().indexOf(term) !== -1;
        });
        response(filtered.slice(0, 30).map(function(c) {
            return { label: c.label, value: c.label, driverValue: c.value };
        }));
    };
}

$(document).ready(function() {
    applyTrackingToggleLabels();

    $('#transferDriverSearch').autocomplete({
        minLength: 0,
        appendTo: '#allUnitsModal',
        source: buildSource(),
        select: function(event, ui) {
            $('#transferDriverSearch').val(ui.item.label);
            $('#transferDriverValue').val(ui.item.driverValue);
            return false;
        }
    }).on('focus click', function() {
        if (allDriverContactsList.length === 0) loadContacts();
        if (!$(this).autocomplete('widget').is(':visible')) {
            $(this).autocomplete('search', $(this).val());
        }
    });

    $('#doTransferBtn').on('click', function() {
        var unitIds = [];
        $('#allUnitsGrid .unit-check:checked').each(function() {
            unitIds.push($(this).val());
        });
        var newDriver = $('#transferDriverValue').val();
        var replaceExisting = $('#replaceExistingUnits').is(':checked') ? 1 : 0;
        if (unitIds.length === 0) {
            $('#allUnitsFlash').html('<div class="alert alert-warning alert-sm" style="padding:4px 8px;font-size:12px;">Select at least one unit.</div>');
            return;
        }
        if (!newDriver) {
            $('#allUnitsFlash').html('<div class="alert alert-warning alert-sm" style="padding:4px 8px;font-size:12px;">Select a driver to transfer to.</div>');
            return;
        }
        $('#doTransferBtn').prop('disabled', true);
        var csrf = $('meta[name="csrf-token"]').attr('content');
        $.ajax({
            url: '<?php echo e(route('booking.units.transfer')); ?>',
            method: 'POST',
            data: { unit_ids: unitIds, new_driver: newDriver, replace_existing: replaceExisting, _token: csrf },
            success: function(res) {
                if (res.success) {
                    $('#allUnitsFlash').html('<div class="alert alert-success" style="padding:4px 8px;font-size:12px;">Units transferred successfully!</div>');
                    // Reload units table
                    loadUnits();
                    // Refresh the unit card(s) on the booking form without destructive side effects.
                    // Triggering driver change events is intentionally avoided — those handlers
                    // clear each other's sections as a side effect.
                    var driverContactEl = document.getElementById('driverContact');
                    var unitStorageEl   = document.getElementById('unitStorage');
                    var mainDriverId    = $('#driverId').val()
                                         || (driverContactEl && driverContactEl.getAttribute('data-drivermain'));
                    var contactId       = (unitStorageEl && unitStorageEl.getAttribute('data-subdriver'))
                                         || $('#driverInfo').val()
                                         || null;
                    var subConId        = (!mainDriverId) ? ($('#driverId2').val() || null) : null;

                    if (mainDriverId) {
                        // Main driver path — re-fetch unit card into #driverContact
                        $.get('<?php echo e(route('booking.driver.contact')); ?>?driverMain=' + mainDriverId + '&_=' + Date.now(), function(html) {
                            $('#driverContact').html(html);
                            if (driverContactEl) driverContactEl.setAttribute('data-drivermain', mainDriverId);
                        });
                    } else if (subConId) {
                        // SubCon selected without a main driver — refresh contact dropdown
                        $.get('<?php echo e(route('booking.driver.contact')); ?>?driver=' + subConId + '&_=' + Date.now(), function(html) {
                            $('#driverContact').html(html);
                            if (!contactId) {
                                var selectedContactId = $('#driverInfo').val();
                                if (selectedContactId) {
                                    $.get('<?php echo e(route('booking.driver.contact')); ?>?subDriver=' + selectedContactId + '&_=' + Date.now(), function(unitHtml) {
                                        $('#unitStorage').html(unitHtml);
                                        if (unitStorageEl) unitStorageEl.setAttribute('data-subdriver', selectedContactId);
                                    });
                                }
                            }
                        });
                    }
                    // Independently refresh contact's unit card if a contact is active
                    if (contactId) {
                        $.get('<?php echo e(route('booking.driver.contact')); ?>?subDriver=' + contactId + '&_=' + Date.now(), function(html) {
                            $('#unitStorage').html(html);
                            if (unitStorageEl) unitStorageEl.setAttribute('data-subdriver', contactId);
                        });
                    }
                } else {
                    $('#allUnitsFlash').html('<div class="alert alert-danger" style="padding:4px 8px;font-size:12px;">' + res.message + '</div>');
                }
                $('#doTransferBtn').prop('disabled', false);
            },
            error: function() {
                $('#allUnitsFlash').html('<div class="alert alert-danger" style="padding:4px 8px;font-size:12px;">An error occurred.</div>');
                $('#doTransferBtn').prop('disabled', false);
            }
        });
    });
});
</script>
<?php endif; ?>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/create.blade.php ENDPATH**/ ?>