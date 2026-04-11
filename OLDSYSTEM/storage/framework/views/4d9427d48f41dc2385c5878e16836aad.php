<div class="booking-form-group" style="display:flex; align-items:center; gap:.4rem; margin-bottom:.35rem;">
    <span style="font-size:.75rem; font-weight:700; color:var(--text-secondary); letter-spacing:.03em; text-transform:uppercase;">Collected Orders</span>
    <a href="javascript:void(0)" class="booking-btn booking-btn-success booking-btn-xs addMore">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
    </a>
</div>

<?php if(isset($collectedOrdersMain) and count($collectedOrdersMain)>0): ?>
<?php $__currentLoopData = $collectedOrdersMain; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $key=>$order): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
    <?php
        $num=$key;
    ?>
    <div class="fieldGroup" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">
        <input type="hidden" name="type" value="main">
        <input type="hidden" name="orders[<?php echo e($num); ?>][orderId]" value="<?php echo e($order->id); ?>">
        <input type="text"
               id="collected_orders"
               placeholder="Order Number"
               name="orders[<?php echo e($num); ?>][collected_orders]"
               value="<?php echo e($order->order_number); ?>"
               class="booking-input styler"
               style="flex:1; min-width:0; max-width:140px;"/>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[<?php echo e($num); ?>][collected_ambience]" value="1" id="collected_ambience" class="form-check-input" <?php if($order->ambience): ?> checked <?php endif; ?>>
            <span class="toggle-chip">Amb</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[<?php echo e($num); ?>][collected_chill]" value="1" id="collected_chill" class="form-check-input" <?php if($order->chill): ?> checked <?php endif; ?>>
            <span class="toggle-chip">Chill</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[<?php echo e($num); ?>][collected_pump]" value="1" id="collected_pump" class="form-check-input" <?php if($order->pump): ?> checked <?php endif; ?>>
            <span class="toggle-chip">Pump</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[<?php echo e($num); ?>][collected_stores]" value="1" id="collected_stores" class="form-check-input" <?php if($order->stores): ?> checked <?php endif; ?>>
            <span class="toggle-chip">Stores</span>
        </label>
        <a href="<?php echo e(route('collected.order.delete',$order->id)); ?>" onclick="return confirm('Are you sure you want to delete?')" class="booking-btn booking-btn-danger booking-btn-xs remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </a>
    </div>
<?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

<?php else: ?>
    <div class="fieldGroup" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">
        <input type="hidden" name="type" value="main">
        <input type="hidden" name="orders[0][orderId]" value="0">
        <input type="text"
               id="collected_orders"
               placeholder="Collected Orders"
               name="orders[0][collected_orders]"
               class="booking-input styler"
               style="flex:1; min-width:0; max-width:140px;"/>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[0][collected_ambience]" value="1" id="collected_ambience" class="form-check-input">
            <span class="toggle-chip">Amb</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[0][collected_chill]" value="1" id="collected_chill" class="form-check-input">
            <span class="toggle-chip">Chill</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[0][collected_pump]" value="1" id="collected_pump" class="form-check-input">
            <span class="toggle-chip">Pump</span>
        </label>
        <label class="booking-check booking-toggle">
            <input type="checkbox" name="orders[0][collected_stores]" value="1" id="collected_stores" class="form-check-input">
            <span class="toggle-chip">Stores</span>
        </label>
        
    </div>
<?php endif; ?>

<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/collectedorders/main.blade.php ENDPATH**/ ?>