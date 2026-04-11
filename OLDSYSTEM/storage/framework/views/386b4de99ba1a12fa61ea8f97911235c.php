<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <link rel="stylesheet" type="text/css" href="<?php echo e(asset('templates/admin/assets/css/reporting.css')); ?>"/>
    <style>
        /* ── Print / PDF Report Styles ── */
        :root {
            --primary:   #2563eb;
            --success:   #16a34a;
            --danger:    #dc2626;
            --border:    #d1d9e0;
            --surface:   #f1f5f9;
            --text:      #0f172a;
            --text-muted:#475569;
            --white:     #ffffff;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            color: var(--text);
            background: var(--white);
            padding: 12px;
        }

        /* ── Report Title ── */
        .report-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid var(--primary);
        }

        /* ── Table ── */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 0;
        }

        thead tr {
            background: #1e293b;
            color: var(--white);
        }

        thead th {
            padding: 5px 6px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: .04em;
            text-transform: uppercase;
            border: none;
            white-space: nowrap;
        }

        tbody tr {
            border-bottom: 1px solid var(--border);
        }

        tbody tr:nth-child(even) {
            background: var(--surface);
        }

        tbody td {
            padding: 4px 6px;
            vertical-align: top;
            color: var(--text);
            line-height: 1.4;
        }

        tfoot tr {
            background: var(--surface);
        }

        tfoot th, tfoot td {
            padding: 5px 6px;
            font-weight: 700;
            border-top: 2px solid var(--border);
            font-size: 10px;
        }

        /* ── Via address highlight ── */
        .via-label {
            color: var(--danger);
            font-weight: 700;
            font-size: 9px;
        }

        /* ── Totals row ── */
        .total-row td {
            font-weight: 700;
            background: #eff6ff;
            color: var(--primary);
        }

        /* ── Fixed header/footer for PDF ── */
        #header, #footer {
            position: fixed;
            left: 0;
            right: 0;
            color: #94a3b8;
            font-size: 9px;
        }
        #header {
            top: 0;
            border-bottom: 0.1pt solid #d1d9e0;
            padding-bottom: 4px;
        }
        #footer {
            bottom: 0;
            border-top: 0.1pt solid #d1d9e0;
            padding-top: 4px;
        }
        .page-number:before {
            content: "Page " counter(page);
        }
    </style>
</head>
<body>

<h4 class="report-title">
    <?php echo e($driverName); ?> <?php echo e($customerName); ?> <?php echo app('translator')->get('main.booking.title'); ?> / Financial Report
    <?php if($dateFrom): ?> — <?php echo e($dateFrom); ?> to <?php echo e($dateTo); ?> <?php endif; ?>
</h4>

<div class="vItems">
    <table cellspacing="0">
        <thead>
        <tr>
            <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.customer'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.purchase_order'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.delivery_date'); ?></th>
            <th>From</th>
            <th>To</th>
            <th>Miles</th>
            <th><?php echo app('translator')->get('main.booking.field.vehicle'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.driver'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.pod_signature'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.pod_time'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.invoice_number'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.customer_price'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.driver_cost'); ?></th>
            <th>Profit</th>
        </tr>
        </thead>
        <tbody>
        <?php
            $profit      = 0;
            $cost        = 0;
            $driverCost  = 0;
        ?>
        <?php $__currentLoopData = $booking; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <?php
                $profit     += $row->cost - $row->driver_cost - $row->cxdriver_cost - $row->extra_cost;
                $cost       += $row->cost + $row->extra_cost2;
                $driverCost += $row->driver_cost + $row->cxdriver_cost + $row->extra_cost;
                $viaAddresses = \App\Models\Viaaddress::where('job_ref', $row->job_ref)->orderBy('via_id')->get();

                $driverLabel = '';
                if ($row->driverName && !$row->secondMan)
                    $driverLabel = $row->driverName;
                elseif ($row->secondMan && !$row->driverName)
                    $driverLabel = $row->secondMan;
                elseif ($row->secondMan && $row->driverName)
                    $driverLabel = $row->driverName . ' / ' . $row->secondMan;
            ?>
            <tr>
                <td><?php echo e($row->customerId); ?>-<?php echo e($row->job_ref); ?></td>
                <td><?php echo e($row->customerName); ?></td>
                <td><?php echo e($row->purchase_order); ?></td>
                <td><?php echo e(\Carbon\Carbon::parse($row->delivery_date, config('timezone'))->format('dS M Y')); ?></td>
                <td>
                    <?php echo e($row->collection_name); ?>,<br>
                    <?php echo e($row->collection_address1); ?><?php if($row->collection_address2): ?>, <?php echo e($row->collection_address2); ?><?php endif; ?><br>
                    <?php echo e($row->collection_area); ?>, <?php echo e($row->collection_postcode); ?>

                    <?php if(count($viaAddresses)): ?>
                        <?php $__currentLoopData = $viaAddresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key => $col): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <br><span class="via-label">Via <?php echo e($key+1); ?> (<?php echo e(strtoupper($col->via_type)); ?>)</span><br>
                            <?php if($col->name): ?><?php echo e($col->name); ?><br><?php endif; ?>
                            <?php echo e($col->address1); ?> <?php echo e($col->address2); ?> <?php echo e($col->area); ?>, <?php echo e($col->postcode); ?>

                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    <?php endif; ?>
                </td>
                <td>
                    <?php echo e($row->delivery_name); ?>,<br>
                    <?php echo e($row->delivery_address1); ?><?php if($row->delivery_address2): ?>, <?php echo e($row->delivery_address2); ?><?php endif; ?><br>
                    <?php echo e($row->delivery_area); ?>, <?php echo e($row->delivery_postcode); ?>

                </td>
                <td><?php echo e($row->miles); ?></td>
                <td><?php echo e($row->vehicleName); ?></td>
                <td><?php echo e($driverLabel); ?><?php echo e($row->cxdriverName); ?></td>
                <td><?php echo e($row->pod_signature); ?></td>
                <td><?php echo e($row->pod_time); ?></td>
                <td><?php echo e($row->invoice_number); ?></td>
                <td><?php echo e($row->cost); ?></td>
                <td><?php echo e(number_format($row->driver_cost + $row->extra_cost + $row->cxdriver_cost, 2)); ?></td>
                <td><?php echo e(number_format(($row->cost - $row->driver_cost - $row->cxdriver_cost - $row->extra_cost), 2)); ?></td>
            </tr>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </tbody>
        <tfoot>
        <tr>
            <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.customer'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.purchase_order'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.delivery_date'); ?></th>
            <th>From</th>
            <th>To</th>
            <th>Miles</th>
            <th><?php echo app('translator')->get('main.booking.field.vehicle'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.driver'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.pod_signature'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.pod_time'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.invoice_number'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.customer_price'); ?></th>
            <th><?php echo app('translator')->get('main.booking.field.driver_cost'); ?></th>
            <th>Profit</th>
        </tr>
        <tr class="total-row">
            <td colspan="12" style="text-align:right;">TOTAL</td>
            <td><?php echo e(number_format($cost, 2)); ?></td>
            <td><?php echo e(number_format($driverCost, 2)); ?></td>
            <td><?php echo e(number_format($profit, 2)); ?></td>
        </tr>
        </tfoot>
    </table>
</div>

<div id="footer">
    <div class="page-number"></div>
</div>

<script type="text/php">
    if (isset($pdf)) {
        $text = "page {PAGE_NUM} / {PAGE_COUNT}";
        $size = 9;
        $font = $fontMetrics->getFont("Verdana");
        $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
        $x = ($pdf->get_width() - $width) / 2;
        $y = $pdf->get_height() - 30;
        $pdf->page_text($x, $y, $text, $font, $size);
    }
</script>
</body>
</html>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/print.blade.php ENDPATH**/ ?>