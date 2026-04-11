<script>
    //MAIN
    $(document).ready(function(){
        //group add limit
        var maxGroup = 10;
        var counter = 20;
        //add more fields group
        $(".addMore").click(function(){
            if($('body').find('.fieldGroup').length < maxGroup){
                var num = counter++;
                var html = '<div class="fieldGroup" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">' +
                    '<input type="hidden" name="type" value="main">' +
                    '<input type="hidden" name="orders['+num+'][orderId]" value="0">' +
                    '<input type="text" placeholder="Order Number" name="orders['+num+'][collected_orders]" class="booking-input styler" style="flex:1; min-width:0; max-width:140px;"/>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders['+num+'][collected_ambience]" value="1" class="form-check-input"><span class="toggle-chip">Amb</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders['+num+'][collected_chill]" value="1" class="form-check-input"><span class="toggle-chip">Chill</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders['+num+'][collected_pump]" value="1" class="form-check-input"><span class="toggle-chip">Pump</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders['+num+'][collected_stores]" value="1" class="form-check-input"><span class="toggle-chip">Stores</span>' +
                    '</label>' +
                    '<a href="javascript:void(0)" class="booking-btn booking-btn-danger booking-btn-xs remove">' +
                    '  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
                    '</a>' +
                    '</div>';
                $('body').find('.fieldGroup:last').after(html);
            }else{
                alert('Maximum '+maxGroup+' addon are allowed.');
            }
        });
        //remove fields group
        $("body").on("click",".remove",function(){
            $(this).parents(".fieldGroup").remove();
        });
    });



    //VIA
    <?php for($num=1; $num<=3; $num++): ?>
    $(document).ready(function(){
        //group add limit
        var maxGroup = 10;
        var counter = 30;
        //add more fields group
        $(".addMore<?php echo e($num); ?>").click(function(){
            if($('body').find('.fieldGroup<?php echo e($num); ?>').length < maxGroup){
                var num = counter++;
                var html = '<div class="fieldGroup<?php echo e($num); ?>" style="display:flex; align-items:center; gap:.35rem; margin-bottom:.35rem;">' +
                    '<input type="hidden" name="orders<?php echo e($num); ?>['+num+'][viaId]" value="<?php echo e($num); ?>" />' +
                    '<input type="hidden" name="orders<?php echo e($num); ?>['+num+'][orderId]" value="">' +
                    '<input type="text" placeholder="Order Number" name="orders<?php echo e($num); ?>['+num+'][collected_orders<?php echo e($num); ?>]" class="booking-input styler" style="flex:1; min-width:0; max-width:140px;"/>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders<?php echo e($num); ?>['+num+'][collected_ambience<?php echo e($num); ?>]" value="1" class="form-check-input"><span class="toggle-chip">Amb</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders<?php echo e($num); ?>['+num+'][collected_chill<?php echo e($num); ?>]" value="1" class="form-check-input"><span class="toggle-chip">Chill</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders<?php echo e($num); ?>['+num+'][collected_pump<?php echo e($num); ?>]" value="1" class="form-check-input"><span class="toggle-chip">Pump</span>' +
                    '</label>' +
                    '<label class="booking-check booking-toggle">' +
                    '  <input type="checkbox" name="orders<?php echo e($num); ?>['+num+'][collected_stores<?php echo e($num); ?>]" value="1" class="form-check-input"><span class="toggle-chip">Stores</span>' +
                    '</label>' +
                    '<a href="javascript:void(0)" class="booking-btn booking-btn-danger booking-btn-xs remove<?php echo e($num); ?>">' +
                    '  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
                    '</a>' +
                    '</div>';
                $('body').find('.fieldGroup<?php echo e($num); ?>:last').after(html);
            }else{
                alert('Maximum '+maxGroup+' addon are allowed.');
            }
        });
        //remove fields group
        $("body").on("click",".remove<?php echo e($num); ?>",function(){
            $(this).parents(".fieldGroup<?php echo e($num); ?>").remove();
        });
    });
    <?php endfor; ?>

</script>

<script type="text/javascript">
    $(document).on('keyup keypress', 'form input[type="text"]', function(e) {
        if(e.which === 13) {
            e.preventDefault();
            return false;
        }
    });
</script>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/collectedorders/js.blade.php ENDPATH**/ ?>