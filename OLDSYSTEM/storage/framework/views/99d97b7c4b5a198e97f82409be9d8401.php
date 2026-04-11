<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.booking.title'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>

<link rel="stylesheet" href="<?php echo e(asset('css/booking-admin.css')); ?>">

    <?php if(session('success')): ?>
        <div class="alert alert-success">
            <?php echo e(session('success')); ?>

        </div>
    <?php endif; ?>
    <?php if(session('error')): ?>
        <div class="alert alert-danger">
            <?php echo e(session('error')); ?>

        </div>
    <?php endif; ?>
    <?php if($errors->any()): ?>
        <div class="alert alert-danger">
            <ul>
                <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <li><?php echo e($error); ?></li>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </ul>
        </div>
    <?php endif; ?>

    <form>
        <input type="hidden" name="job_ref" value="<?php echo e($booking->job_ref); ?>">
        <div class="row mb-2 htsDisplay">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header" style="">
                        <nav class="nav  justify-content-between"> <a class="navbar-brand">Job Ref <?php echo e($customers->account_number); ?>-<?php echo e($booking->job_ref); ?> <span class="badge badge-danger"><?php if(count($addresses)>0): ?><?php echo e(count($addresses)); ?></span><?php endif; ?></a> <a href="<?php echo e(route('home')); ?>" class="btn btn-info btn-sm"><i class="fa fa-reply"></i> <?php echo app('translator')->get('app.goback'); ?></a> </nav>
                    </div>
                    <div class="card-body pt-3">
<?php
    $hasUnits = $booking->chill_unit || $booking->ambient_unit;
    $hasPendingVia = collect($addresses ?? [])->contains(function ($via) {
        return empty($via->signed_by);
    });
    $podComplete = (int) ($booking->pod_data_verify ?? 0) === 1
        && strlen(trim((string) ($booking->pod_signature ?? ''))) > 0
        && strlen(trim((string) ($booking->pod_time ?? ''))) > 0;
    $isTrackingCompleted = $podComplete && ! $hasPendingVia;
    $hideTrackingMap = (int) ($booking->hide_tracking_map ?? 0) === 1;
    $hideTrackingTemperature = (int) ($booking->hide_tracking_temperature ?? 0) === 1;
    $showTrackingMap = $hasUnits && ! $isTrackingCompleted && ! $hideTrackingMap;
    // Order type flags
    $hasAmbOrders   = $collectedOrdersMain->contains('ambience', 1) || $collectedOrdersVia->contains('ambience', 1);
    $hasChillOrders = $collectedOrdersMain->contains('chill', 1)     || $collectedOrdersVia->contains('chill', 1);
    $hasPumpOrders   = $collectedOrdersMain->contains('pump', 1)   || $collectedOrdersVia->contains('pump', 1);
    $hasStoresOrders = $collectedOrdersMain->contains('stores', 1)  || $collectedOrdersVia->contains('stores', 1);

    // Query actual unit types from storages table (Eloquent $booking doesn't have joined columns)
    $assignedUnitIds = array_filter([$booking->chill_unit, $booking->ambient_unit]);
    $assignedUnitTypes = $assignedUnitIds
        ? \App\Models\Storages::whereIn('id', $assignedUnitIds)->pluck('unit_type')->map(fn($t) => strtolower(trim($t)))->all()
        : [];
    $bookingHasAmbientUnit = in_array('ambient', $assignedUnitTypes);
    $bookingHasChillUnit   = in_array('chill',   $assignedUnitTypes);
    $showAmbBox   = ! $hideTrackingTemperature && $hasAmbOrders   && $bookingHasAmbientUnit;
    $showChillBox = ! $hideTrackingTemperature && $hasChillOrders && $bookingHasChillUnit;
?>
                        
                        <div style="display:grid; grid-template-columns:5fr 7fr; gap:0; align-items:start; width:100%; border:1px solid #dee2e6; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.07);">

                        
                        <div style="border-right:1px solid #dee2e6;">
                            <div style="background:#343a40; color:#fff; padding:6px 12px; font-size:.85rem; font-weight:600;">&#x1F4CB; POD Information</div>
                            <div style="padding:12px; font-size:.85rem;">
                                   

    <?php if(count($addresses)): ?>
        <?php $__currentLoopData = $addresses; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $index => $col): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <div class="mb-3 p-3 border rounded shadow-sm">
                
                
                <h6 class="text-danger mb-2">VIA <?php echo e($index + 1); ?>:</h6>

                
                <div>
                    <span class="fw-bold">Postcode:</span> 
                    <span class="text-primary"><?php echo e($col->postcode); ?></span>
                </div>
				
				  
<?php if(!empty($col->via_time)): ?>
    <div>
        <span class="fw-bold">Rough ETA:</span>
        <span class="text-primary">
            <?php echo e(\Carbon\Carbon::parse($col->via_time, config('timezone'))->format('H:ia')); ?>

        </span>
    </div>
<?php endif; ?>
				
				  
                <?php
                    $orders = Helper::orderVia($booking->job_ref, 'via', $index + 1);
                ?>
                <?php if(count($orders)): ?>
                    <div class="mt-2">
                        <?php $__currentLoopData = $orders; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $order): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <div class="row mb-1">
                                <div class="col-lg-5">
                                    <span class="fw-bold">Collected Order:</span> <?php echo e($order->order_number); ?>

                                    <?php if($order->ambience || $order->chill || $order->pump || $order->stores): ?>
                                    <span style="display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle;">
                                        <?php if($order->ambience): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span><?php endif; ?>
                                        <?php if($order->chill): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span><?php endif; ?>
                                        <?php if($order->pump): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span><?php endif; ?>
                                        <?php if($order->stores): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span><?php endif; ?>
                                    </span>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </div>
                <?php endif; ?>

               
<?php if(!empty($col->via_pod_data_verify)): ?>

    <?php if(!empty($col->signed_by)): ?>
        <div>
            <span class="fw-bold">Signed By:</span> 
            <span class="text-primary"><?php echo e($col->signed_by); ?></span>
        </div>
    <?php endif; ?>

    <?php if(!empty($col->time)): ?>
        <div>
            <span class="fw-bold">Delivered Time:</span> 
            <span class="text-primary">
                <?php echo e(\Carbon\Carbon::parse($col->date, config('timezone'))->format('dS M Y')); ?>

                <?php echo e(\Carbon\Carbon::parse($col->time, config('timezone'))->format('H:ia')); ?>

            </span>
        </div>
    <?php endif; ?>

    <?php if(!empty($col->delivered_temperature)): ?>
        <div>
            <span class="fw-bold">Delivered Temperature:</span> 
            <span class="text-primary"><?php echo e($col->delivered_temperature); ?></span>
        </div>
    <?php endif; ?>

<?php endif; ?>


              

            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    <?php else: ?>
        <div class="text-muted">No VIA addresses available.</div>
    <?php endif; ?>

                                       <?php if($booking->pod_data_verify): ?>
    <div class="mb-3 p-3 border rounded shadow-sm">

        
        <h6 class="text-danger mb-2">FINAL DEL:</h6>

        
        <div>
            <span class="fw-bold">Postcode:</span> 
            <span class="text-primary"><?php echo e($booking->delivery_postcode); ?></span>
        </div>

       

        
        <?php if(!empty($booking->delivery_time)): ?>
            <div>
                <span class="fw-bold">Rough ETA:</span> 
                <span class="text-primary"><?php echo e(\Carbon\Carbon::parse($booking->delivery_time, config('timezone'))->format('H:ia')); ?></span>
            </div>
        <?php endif; ?>


        
        <?php
            $orders = Helper::orderMain($booking->job_ref);
        ?>
        <?php if(count($orders)): ?>
            <div class="mt-2">
                <?php $__currentLoopData = $orders; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $order): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="row mb-1">
                        <div class="col-lg-5">
                            <span class="fw-bold">Collected Order:</span> <?php echo e($order->order_number); ?>

                            <?php if($order->ambience || $order->chill || $order->pump || $order->stores): ?>
                            <span style="display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle;">
                                <?php if($order->ambience): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span><?php endif; ?>
                                <?php if($order->chill): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span><?php endif; ?>
                                <?php if($order->pump): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span><?php endif; ?>
                                <?php if($order->stores): ?><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span><?php endif; ?>
                            </span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        <?php endif; ?>
 
       <?php if(!empty($booking->pod_signature)): ?>
    <div>
        <span class="fw-bold">Signed By:</span> 
        <span class="text-primary"><?php echo e($booking->pod_signature); ?></span>
    </div>
<?php endif; ?>

        
        <?php if(!empty($booking->pod_time)): ?>
            <div>
                <span class="fw-bold">Delivered Time:</span>
                <span class="text-primary">
                    <?php echo e(\Carbon\Carbon::parse($booking->pod_date, config('timezone'))->format('dS M Y')); ?>

                    <?php echo e(\Carbon\Carbon::parse($booking->pod_time, config('timezone'))->format('H:ia')); ?>

                </span>
            </div>
        <?php endif; ?>
		 
        <?php if(!empty($booking->delivered_temperature)): ?>
            <div>
                <span class="fw-bold">Delivered Temperature:</span> 
                <span class="text-primary"><?php echo e($booking->delivered_temperature); ?></span>
            </div>
        <?php endif; ?>
    </div>
<?php endif; ?>
                                        <br>
                                        <?php if($booking->job_notes): ?>
                                            <div class="notices pt-2 pb-3">
                                                <div style="font-weight: bold">Job Notes:</div>
                                                <div class="notice" style="font-size: 11px;"><?php echo nl2br($booking->job_notes); ?></div>
                                            </div>
                                        <?php endif; ?>
                                        <?php if(count($uploads)): ?>
                                            <div class="form-group">
                                                <p>Attachments</p>
                                                <hr>
                                                <div class="row app-gallery"> <?php $__currentLoopData = $uploads; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $upload): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                                        <div class="col-lg-4 col-sm-12" data-id="row-<?php echo e($upload->id); ?>"> <a href="<?php echo e(asset('uploads')); ?>/<?php echo e($upload->filename); ?>" class="d-block mb-4" target="_blank"> <?php if(file_exists(base_path('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png'))): ?> <img class="img-fluid img-thumbnail file-width lightbox" src="<?php echo e(asset('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')); ?>" alt=""> <?php else: ?> <img class="img-fluid img-thumbnail file-width lightbox" src="<?php echo e(asset('templates/admin/images/icons/file.png')); ?>" alt=""> <?php endif; ?> </a> </div>
                                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?> </div>
                                            </div>
                                        <?php endif; ?>
                            </div>
                        </div>

                        <?php if($showTrackingMap): ?>
                        
                        <div style="border-left:1px solid #dee2e6; display:flex; flex-direction:column;">
                            
                            <div style="background:#343a40; color:#fff; padding:6px 12px; font-size:.85rem; font-weight:600;">&#x1F4CD; Live Unit Locations</div>
                            
                            <div id="unitMap" style="height:260px; width:100%;"></div>

                            <?php if($showAmbBox || $showChillBox): ?>
                            
                            <div style="border-top:1px solid #dee2e6; padding:10px; display:flex; gap:10px;">

                                <?php if($showAmbBox): ?>
                                <div id="unitTempAmb" style="flex:1; background:linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%); border:2px solid #f59e0b; border-radius:10px; padding:12px 8px; text-align:center; box-shadow:0 2px 8px rgba(245,158,11,.18);">
                                    <div style="font-size:.55rem; font-weight:700; color:#92400e; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px;">&#x1F321; <span id="unitTempAmbLabel">Ambient</span></div>
                                    <div id="unitTempAmbVal" style="font-size:1.6rem; font-weight:800; color:#b45309; line-height:1;">--</div>
                                    <div id="unitTempAmbTime" style="font-size:.5rem; color:#a16207; margin-top:6px; opacity:.7;"></div>
                                </div>
                                <?php endif; ?>

                                <?php if($showChillBox): ?>
                                <div id="unitTempChill" style="flex:1; background:linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%); border:2px solid #3b82f6; border-radius:10px; padding:12px 8px; text-align:center; box-shadow:0 2px 8px rgba(59,130,246,.18);">
                                    <div style="font-size:.55rem; font-weight:700; color:#1e3a8a; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px;">&#x2744;&#xFE0F; <span id="unitTempChillLabel">Chill</span></div>
                                    <div id="unitTempChillVal" style="font-size:1.6rem; font-weight:800; color:#1d4ed8; line-height:1;">--</div>
                                    <div id="unitTempChillTime" style="font-size:.5rem; color:#1e40af; margin-top:6px; opacity:.7;"></div>
                                </div>
                                <?php endif; ?>

                            </div>
                            <?php endif; ?>

                        </div>
                        <?php endif; ?>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <?php echo $__env->make('partials.bookingjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
    <?php echo $__env->make('partials.autocomplete', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

<?php if($showTrackingMap): ?>
<script>
(function () {
    var unitMap = null;
    var unitMarkers = [];
    var unitLocationsUrl = '<?php echo e(route('booking.unit.locations', ['id' => $booking->job_ref])); ?>';
    var googleApiKey     = '<?php echo e(config('services.google.api_key')); ?>';
    var hideTrackingTemperature = "<?php echo e($hideTrackingTemperature ? 1 : 0); ?>" === "1";
    var showAmbUnit    = <?php echo e($showAmbBox    ? 'true' : 'false'); ?>;
    var showChillUnit  = <?php echo e($showChillBox  ? 'true' : 'false'); ?>;
    var showPumpUnit   = <?php echo e($hasPumpOrders   ? 'true' : 'false'); ?>;
    var showStoresUnit = <?php echo e($hasStoresOrders ? 'true' : 'false'); ?>;

    function clearUnitMarkers() {
        unitMarkers.forEach(function (m) { m.setMap(null); });
        unitMarkers = [];
    }

    function initUnitMap() {
        unitMap = new google.maps.Map(document.getElementById('unitMap'), {
            zoom: 12,
            center: { lat: 51.5074, lng: -0.1278 },
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: false,
            streetViewControl: false,
            mapTypeControl: false,
        });
        loadUnitMarkers();
    }

    function loadUnitMarkers() {
        fetch(unitLocationsUrl + '?_=' + Date.now())
            .then(function (r) { return r.json(); })
            .then(function (units) {
                if (!units || units.length === 0) {
                    return;
                }

                // Filter units to only those whose kind matches the ticked order types.
                // If no order types are active at all, show every unit (tracking-only job).
                // If pump or stores orders are ticked, all available units are shown.
                var anyOrderType = showAmbUnit || showChillUnit || showPumpUnit || showStoresUnit;
                units = units.filter(function (unit) {
                    if (!anyOrderType) return true;          // no specific types — show all
                    if (showPumpUnit || showStoresUnit) return true;
                    if (unit.kind === 'ambient') return showAmbUnit;
                    if (unit.kind === 'chill')   return showChillUnit;
                    return true; // unknown kind — show by default
                });

                if (units.length === 0) { return; }

                clearUnitMarkers();

                var bounds  = new google.maps.LatLngBounds();
                var infoWin = new google.maps.InfoWindow();

                units.forEach(function (unit) {
                    var pos  = { lat: unit.lat, lng: unit.lng };
                    var temp = unit.temperature !== null && unit.temperature !== undefined
                        ? unit.temperature + ' \u00B0C'
                        : 'N/A';

                    var marker = new google.maps.Marker({
                        position: pos,
                        map: unitMap,
                        title: unit.label,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 9,
                            fillColor: '#0d6efd',
                            fillOpacity: 1,
                            strokeColor: '#fff',
                            strokeWeight: 2,
                        }
                    });
                    unitMarkers.push(marker);

                    if (!hideTrackingTemperature) {
                        var content = '<div style="font-size:13px;line-height:1.6;">'
                            + '<strong>' + unit.label + '</strong>'
                            + '<br>&#x1F321; Temperature: <strong>' + temp + '</strong>'
                            + (unit.updated ? '<br><small class="text-muted">Updated: ' + unit.updated + '</small>' : '')
                            + '</div>';

                        marker.addListener('click', function () {
                            infoWin.setContent(content);
                            infoWin.open(unitMap, marker);
                        });
                    }

                    bounds.extend(pos);
                    if (!hideTrackingTemperature) {
                        var isAmb   = unit.kind === 'ambient';
                        var isChill = unit.kind === 'chill';
                        var valEl   = isAmb ? document.getElementById('unitTempAmbVal')   : (isChill ? document.getElementById('unitTempChillVal')   : null);
                        var timeEl  = isAmb ? document.getElementById('unitTempAmbTime')  : (isChill ? document.getElementById('unitTempChillTime')  : null);
                        var labelEl = isAmb ? document.getElementById('unitTempAmbLabel') : (isChill ? document.getElementById('unitTempChillLabel') : null);
                        if (labelEl && unit.number) labelEl.textContent = unit.number;
                        if (valEl)  valEl.innerHTML  = temp;
                        if (timeEl && unit.updated) timeEl.innerHTML = unit.updated;
                    }
                });

                unitMap.fitBounds(bounds);
            })
            .catch(function () {
                // Could not retrieve unit location data
            });
    }

    // Auto-refresh every 60 seconds
    setInterval(function () {
        if (unitMap) loadUnitMarkers();
    }, 60000);

    // Load Google Maps and initialise
    if (typeof google !== 'undefined' && google.maps) {
        initUnitMap();
    } else {
        var script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + googleApiKey + '&callback=initUnitMap';
        script.async = true;
        script.defer = true;
        window.initUnitMap = initUnitMap;
        document.head.appendChild(script);
    }
})();
</script>
<?php endif; ?>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/customerAccess/details.blade.php ENDPATH**/ ?>