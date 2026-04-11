<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.booking.title'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-shared.css')); ?>">

<?php if(session('success')): ?>
    <div class="bk-alert bk-alert-success">
        <span class="bk-alert-icon">✔</span>
        <span><?php echo e(session('success')); ?></span>
    </div>
<?php endif; ?>
<?php if(session('error')): ?>
    <div class="bk-alert bk-alert-danger">
        <span class="bk-alert-icon">✖</span>
        <span><?php echo e(session('error')); ?></span>
    </div>
<?php endif; ?>
<?php if($errors->any()): ?>
    <div class="bk-alert bk-alert-danger">
        <span class="bk-alert-icon">⚠</span>
        <ul>
            <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <li><?php echo e($error); ?></li>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </ul>
    </div>
<?php endif; ?>

<?php if(($booking->pod_data_verify && !$booking->pod_mobile) || (!$booking->pod_data_verify && $booking->pod_mobile)): ?>

<form action="<?php echo e(route('booking.update.pod',['id'=>$booking->job_ref])); ?>" method="post" name="hezecomform"
      class="form-horizontal" enctype="multipart/form-data">
    <?php echo e(csrf_field()); ?>

    <input type="hidden" name="job_ref" value="<?php echo e($booking->job_ref); ?>">

    <div class="bk-page">

        <div class="bk-card">

            
            <div class="bk-card-header header-teal">
                <h1 class="bk-card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Job Ref <?php echo e($customers->account_number); ?>-<?php echo e($booking->job_ref); ?> — POD Info
                    <?php if(count($addresses) > 0): ?>
                        <span class="bk-badge bk-badge-danger"><?php echo e(count($addresses)); ?></span>
                    <?php endif; ?>
                </h1>
                <div class="bk-card-header-actions">
                    <a href="<?php echo e(\Illuminate\Support\Facades\URL::previous()); ?>" class="bk-btn bk-btn-danger bk-btn-sm">
                        ← <?php echo app('translator')->get('app.goback'); ?>
                    </a>
                </div>
            </div>

            <div class="bk-card-body">
                <div class="hts-flash"></div>

                <div class="row">

                    
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="bk-section">
                            <div class="bk-section-header header-teal">
                                <span class="section-icon">📎</span>
                                Upload POD
                            </div>
                            <div class="bk-section-body">

                                <div class="bk-pod-upload-area">
                                    <input type="file" id="fileupload" value="" name="filename[]" class="styler" />
                                    <span id="addVar" class="bk-btn bk-btn-success bk-btn-sm" style="align-self:flex-start;">
                                        + <?php echo app('translator')->get('app.addfield'); ?>
                                    </span>
                                </div>

                                
                                <?php if(count($uploads)): ?>
                                    <div class="bk-pod-preview bk-mt-2">
                                        <?php $__currentLoopData = $uploads; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $upload): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                            <div style="position:relative;" data-id="row-<?php echo e($upload->id); ?>">
                                                <a href="<?php echo e(route('booking.download.pod',['file'=>$upload->filename])); ?>" class="d-block">
                                                    <?php if(file_exists(base_path('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png'))): ?>
                                                        <img class="img-fluid img-thumbnail file-width lightbox"
                                                             src="<?php echo e(asset('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')); ?>" alt="">
                                                    <?php else: ?>
                                                        <img class="img-fluid img-thumbnail file-width lightbox"
                                                             src="<?php echo e(asset('templates/admin/images/icons/file.png')); ?>" alt="">
                                                    <?php endif; ?>
                                                </a>
                                                <a href="javascript:void(0)"
                                                   onclick="deleteFile('<?php echo e(url('admin/booking/deletefile2')); ?>','<?php echo e($upload->id); ?>')"
                                                   class="bk-btn bk-btn-danger bk-btn-xs"
                                                   style="position:absolute; top:2px; left:2px;">
                                                    🗑
                                                </a>
                                            </div>
                                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                    </div>
                                <?php endif; ?>

                                <div class="bk-form-group bk-mt-2">
                                    <textarea class="bk-textarea styler"
                                              placeholder="Driver Note"
                                              id="driver_note"
                                              name="driver_note"
                                              rows="3"><?php echo e($booking->driver_note); ?></textarea>
                                </div>

                            </div>
                        </div>
                    </div>

                    
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="bk-section">
                            <div class="bk-section-header header-green">
                                <span class="section-icon">✅</span>
                                POD Details
                            </div>
                            <div class="bk-section-body">

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon"><?php echo app('translator')->get('main.booking.field.pod_signature'); ?></span>
                                        <input id="pod_signature" name="pod_signature"
                                               class="bk-input styler"
                                               type="text" maxlength="100"
                                               value="<?php echo e($booking->pod_signature); ?>"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.pod_signature'); ?>" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">Date</span>
                                        <input id="pod_date" name="pod_date"
                                               class="bk-input styler date1"
                                               type="text"
                                               value="<?php if($booking->pod_date): ?><?php echo e(\Carbon\Carbon::parse($booking->pod_date)->format('d-m-Y')); ?><?php endif; ?>"
                                               placeholder="Date" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon"><?php echo app('translator')->get('main.booking.field.pod_time'); ?></span>
                                        <input id="pod_time" name="pod_time"
                                               class="bk-input styler timepicker2"
                                               type="text" maxlength="20"
                                               value="<?php echo e($booking->pod_time); ?>"
                                               placeholder="<?php echo app('translator')->get('main.booking.field.pod_time'); ?>" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">🌡 Temp</span>
                                        <input id="delivered_temperature" name="delivered_temperature"
                                               class="bk-input styler"
                                               type="text" maxlength="20"
                                               value="<?php echo e($booking->delivered_temperature); ?>"
                                               placeholder="Delivered Temperature" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>

        
        <div class="accordion" id="accordionExample">
            <div class="row">
                <?php if ($__env->exists('admin.viaaddress.formEditPOD')) echo $__env->make('admin.viaaddress.formEditPOD', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
            </div>
        </div>

        
        <div class="bk-save-btn-wrapper">
            <button type="submit" class="bk-btn-save" name="btn-save" id="btnStatus">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Approve POD
            </button>
        </div>

    </div>

</form>

<?php else: ?>

<div class="bk-page">
    <div class="bk-card">
        <div class="bk-card-header header-teal">
            <h1 class="bk-card-title">
                Job Ref <?php echo e($customers->account_number); ?>-<?php echo e($booking->job_ref); ?> — POD Info
                <?php if(count($addresses) > 0): ?>
                    <span class="bk-badge bk-badge-danger"><?php echo e(count($addresses)); ?></span>
                <?php endif; ?>
            </h1>
            <div class="bk-card-header-actions">
                <a href="<?php echo e(\Illuminate\Support\Facades\URL::previous()); ?>" class="bk-btn bk-btn-danger bk-btn-sm">
                    ← <?php echo app('translator')->get('app.goback'); ?>
                </a>
            </div>
        </div>
        <div class="bk-card-body bk-text-center" style="padding:2rem;">
            <p style="font-size:1rem; color:var(--danger); font-weight:600;">
                ✅ POD information has already been updated!
            </p>
        </div>
    </div>
</div>

<?php endif; ?>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/edit-pod.blade.php ENDPATH**/ ?>