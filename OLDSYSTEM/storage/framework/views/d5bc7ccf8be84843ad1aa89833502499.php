<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | Booking Postcode Details
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>


<link rel="stylesheet" href="<?php echo e(asset('css/booking-shared.css')); ?>">

<div class="bk-page">

    <div class="bk-card">

        
        <div class="bk-card-header">
            <h1 class="bk-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Booking Postcode Details
            </h1>
            <div class="bk-card-header-actions">
                <a href="<?php echo e(\Illuminate\Support\Facades\URL::previous()); ?>" class="bk-btn bk-btn-info bk-btn-sm">
                    ← <?php echo app('translator')->get('app.goback'); ?>
                </a>
                <a href="<?php echo e(\Illuminate\Support\Facades\URL::current().'?archive=0&state=1'); ?>" class="bk-btn bk-btn-danger bk-btn-sm">
                    📥 Export to Excel
                </a>
            </div>
        </div>

        
        <div class="bk-card-body" style="padding:0;">
            <div class="bk-table-wrapper">
                <table id="booking_datatable" class="bk-table">
                    <thead>
                    <tr>
                        <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
                        <th>Postcodes</th>
                        <th>Mileage</th>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Extra Cost Information</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    <?php $sumTotal = 0; ?>
                    <?php $__currentLoopData = $booking; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php
                            $total = $row->cost + $row->extra_cost2;
                            $sumTotal += $total;
                            $viaAddresses = \App\Models\Viaaddress::where('job_ref', $row->job_ref)
                                ->whereNull('deleted_at')
                                ->orderBy('via_id')
                                ->get();
                        ?>
                        <tr>
                            <td><?php echo e($row->customerId); ?>-<?php echo e($row->job_ref); ?></td>
                            <td>
                                <?php if(count($viaAddresses)): ?>
                                    <?php $__currentLoopData = $viaAddresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key => $col): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <?php if($col->postcode): ?><?php echo e($col->postcode); ?>, <?php endif; ?>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                <?php endif; ?>
                                <?php echo e($row->delivery_postcode); ?>

                            </td>
                            <td><?php echo e($row->miles); ?></td>
                            <td><?php echo e(\Carbon\Carbon::parse($row->delivery_date, config('timezone'))->format('d/m/Y')); ?></td>
                            <td><?php echo e($row->vehicleName); ?></td>
                            <td><?php echo e($row->manual_desc); ?></td>
                            <td style="text-align:right;">
                                <span class="bk-cost-value text-success"><?php echo e(env('CURRENCY_SYMBOL').number_format($total, 2)); ?></span>
                            </td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <tr style="background:var(--surface-alt);">
                        <td colspan="6" style="text-align:right; font-weight:700; font-size:.85rem; color:var(--text-secondary);">TOTAL</td>
                        <td style="text-align:right;">
                            <span class="bk-cost-value text-success" style="font-size:1rem;"><?php echo e(env('CURRENCY_SYMBOL').number_format($sumTotal, 2)); ?></span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

</div>

<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/postcode.blade.php ENDPATH**/ ?>