<script src="<?php echo e(asset('vendor/jquery/jquery-3.2.1.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/popper/popper.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/bootstrap4/js/bootstrap.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/chartjs/Chart.bundle.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/datatable/datatables.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/jqueryForm/jquery.form.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/jqueryConfirm/jquery-confirm.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/dropzone/dropzone.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/baguetteBox/baguetteBox.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/slimscroll/jquery.slimscroll.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/nano-scroll/jquery.nanoscroller.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/metisMenu/metisMenu.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/pace/pace.min.js')); ?>"></script>
<!-- DataTimePicker -->
<script src="<?php echo e(asset('vendor/bootstrap-daterangepicker/moment.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/bootstrap-daterangepicker/daterangepicker.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/clockpicker/bootstrap-clockpicker.min.js')); ?>"></script>
<script src="<?php echo e(asset('vendor/jquery-ui/jquery-ui.min.js')); ?>"></script>

<script src="https://cc-cdn.com/generic/scripts/v1/cc_c2a.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?key=<?php echo e(env('GOOGLE_API_KEY')); ?>&libraries=places&sensor=true"></script>
<script src="<?php echo e(asset('templates/admin/assets/js/custom.js')); ?>"></script>
<?php echo $__env->make('partials.customjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/partials/appjs.blade.php ENDPATH**/ ?>