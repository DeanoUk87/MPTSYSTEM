<div class="booking-form-group" style="display:flex; align-items:center; gap:.4rem; margin-bottom:.35rem;">
    <span style="font-size:.75rem; font-weight:700; color:var(--text-secondary); letter-spacing:.03em; text-transform:uppercase;">Collected Orders</span>
    <a href="javascript:void(0)" class="booking-btn booking-btn-success booking-btn-xs addMore<?php echo e($num); ?>">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
    </a>
</div>

<?php if(isset($booking) and count(Helper::orderVia($booking->job_ref,'via',$num))>0): ?>
    <?php $__currentLoopData = Helper::orderVia($booking->job_ref,'via',$num); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key=>$order): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <?php
            $akey=$key+100;
        ?>
        <div class="fieldGroup<?php echo e($num); ?>" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">
            <input type="hidden" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][viaId]" value="<?php echo e($order->via); ?>" />
            <input type="hidden" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][orderId]" value="<?php echo e($order->id); ?>">
            <input type="text"
                   id="collected_orders<?php echo e($num); ?>"
                   placeholder="Order Number"
                   name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][collected_orders<?php echo e($num); ?>]"
                   value="<?php echo e($order->order_number); ?>"
                   class="booking-input styler"
                   style="flex:1; min-width:0; max-width:140px;"/>
            <label class="booking-check booking-toggle">
                <input type="checkbox" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][collected_ambience<?php echo e($num); ?>]" value="1" id="collected_ambience<?php echo e($num); ?>" class="form-check-input" <?php if($order->ambience): ?> checked <?php endif; ?>>
                <span class="toggle-chip">Amb</span>
            </label>
            <label class="booking-check booking-toggle">
                <input type="checkbox" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][collected_chill<?php echo e($num); ?>]" value="1" id="collected_chill<?php echo e($num); ?>" class="form-check-input" <?php if($order->chill): ?> checked <?php endif; ?>>
                <span class="toggle-chip">Chill</span>
            </label>
            <label class="booking-check booking-toggle">
                <input type="checkbox" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][collected_pump<?php echo e($num); ?>]" value="1" id="collected_pump<?php echo e($num); ?>" class="form-check-input" <?php if($order->pump): ?> checked <?php endif; ?>>
                <span class="toggle-chip">Pump</span>
            </label>
            <label class="booking-check booking-toggle">
                <input type="checkbox" name="orders<?php echo e($num); ?>[<?php echo e($akey); ?>][collected_stores<?php echo e($num); ?>]" value="1" id="collected_stores<?php echo e($num); ?>" class="form-check-input" <?php if($order->stores): ?> checked <?php endif; ?>>
                <span class="toggle-chip">Stores</span>
            </label>
            <a href="<?php echo e(route('collected.order.delete',$order->id)); ?>" onclick="return confirm('Are you sure you want to delete?')" class="booking-btn booking-btn-danger booking-btn-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </a>
        </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

<?php else: ?>

    <div class="fieldGroup<?php echo e($num); ?>" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">
        <input type="hidden" name="orders<?php echo e($num); ?>[0][viaId]" value="<?php echo e($num); ?>" />
        <input type="hidden" name="orders<?php echo e($num); ?>[0][orderId]" value="">
        <input type="text"
               id="collected_orders<?php echo e($num); ?>"
               placeholder="Collected Orders"
               name="orders<?php echo e($num); ?>[0][collected_orders<?php echo e($num); ?>]"
               class="booking-input styler"
               style="flex:1; min-width:0; max-width:140px;"/>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders<?php echo e($num); ?>[0][collected_ambience<?php echo e($num); ?>]" value="1" id="collected_ambience<?php echo e($num); ?>" class="form-check-input">
            <span class="toggle-chip">Amb</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders<?php echo e($num); ?>[0][collected_chill<?php echo e($num); ?>]" value="1" id="collected_chill<?php echo e($num); ?>" class="form-check-input">
            <span class="toggle-chip">Chill</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders<?php echo e($num); ?>[0][collected_pump<?php echo e($num); ?>]" value="1" id="collected_pump<?php echo e($num); ?>" class="form-check-input">
            <span class="toggle-chip">Pump</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders<?php echo e($num); ?>[0][collected_stores<?php echo e($num); ?>]" value="1" id="collected_stores<?php echo e($num); ?>" class="form-check-input">
            <span class="toggle-chip">Stores</span>
        </label>
        
    </div>
<?php endif; ?>

<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/collectedorders/via.blade.php ENDPATH**/ ?>