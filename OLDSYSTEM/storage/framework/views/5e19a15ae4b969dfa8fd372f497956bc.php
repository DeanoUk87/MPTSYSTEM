<style>
    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #333;
    }

    .invoice-wrapper {
        width: 100%;
    }

    .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    .header-table td {
        vertical-align: top;
    }

    .company-name {
        font-size: 18px;
        font-weight: bold;
    }

    .document-title {
        font-size: 14px;
        margin-top: 4px;
        color: #555;
    }

    .statement-title {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin: 15px 0 5px 0;
    }

    .date-range {
        text-align: center;
        font-size: 12px;
        margin-bottom: 20px;
        color: #666;
    }

    .items-table {
        width: 100%;
        border-collapse: collapse;
    }

    .items-table th {
        background-color: #f2f2f2;
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
        font-weight: bold;
    }

    .items-table td {
        border: 1px solid #ccc;
        padding: 8px;
    }

    .text-right {
        text-align: right;
    }

    .total-row td {
        font-weight: bold;
        background-color: #f9f9f9;
    }

    .footer-note {
        margin-top: 25px;
        font-size: 10px;
        color: #777;
        text-align: center;
    }
</style>

<div class="invoice-wrapper">

    
    <table class="header-table">
        <tr>
            <td width="50%">
                <?php if(file_exists(base_path('uploads').'/'.$userinfo->upload_logo)): ?>
                        <img class="file-width" src="<?php echo e(asset('uploads')); ?>/<?php echo e($userinfo->upload_logo); ?>" alt="logo" style="max-width:80px;">
                    <?php endif; ?>
            </td>
            <td width="50%" style="text-align: right;">
                <div class="company-name">
                    <?php echo e($userinfo->business_name); ?>

                </div>
                <div class="document-title">
                    Job Statement
                </div>
            </td>
        </tr>
    </table>

    
    <div class="statement-title">
        <?php echo e($driverName); ?> <?php echo e($customerName); ?> Statement
    </div>

    <?php if($dateFrom): ?>
        <div class="date-range">
            From <?php echo e($dateFrom); ?> to <?php echo e($dateTo); ?>

        </div>
    <?php endif; ?>


    
    <table class="items-table">
        <thead>
        <tr>
            <th width="20%">Job Ref</th>
            <th width="20%">Delivery Date</th>
            <th width="40%">Postcodes</th>
            <th width="20%" class="text-right">Driver Cost</th>
        </tr>
        </thead>
        <tbody>

        <?php $total = 0; ?>

        <?php $__currentLoopData = $booking; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>

            <?php
                $total += $row->driver_cost + $row->extra_cost;
                $viaAddresses = \App\Models\Viaaddress::where('job_ref',$row->job_ref)
                                ->whereNull('deleted_at')
                                ->orderBy('via_id')
                                ->get();
            ?>

            <tr>
                <td><?php echo e($row->customerId); ?>-<?php echo e($row->job_ref); ?></td>

                <td>
                    <?php echo e(\Carbon\Carbon::parse($row->delivery_date, config('timezone'))->format('d M Y')); ?>

                </td>

                <td>
                    <?php echo e($row->collection_postcode); ?>,
                    <?php echo e($row->delivery_postcode); ?>

                    <?php $__currentLoopData = $viaAddresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $col): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php if($col->postcode): ?>, <?php echo e($col->postcode); ?><?php endif; ?>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </td>

                <td class="text-right">
                    <?php echo env('CURRENCY_SYMBOL'); ?>

                    <?php echo e(number_format($row->driver_cost + $row->extra_cost, 2)); ?>

                </td>
            </tr>

        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

        <tr class="total-row">
            <td colspan="3" class="text-right">
                TOTAL
            </td>
            <td class="text-right">
                <?php echo env('CURRENCY_SYMBOL'); ?>

                <?php echo e(number_format($total, 2)); ?>

            </td>
        </tr>

        </tbody>
    </table>

    <div class="footer-note">
        Generated on <?php echo e(now()->format('d M Y H:i')); ?>

    </div>

</div><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/driver.blade.php ENDPATH**/ ?>