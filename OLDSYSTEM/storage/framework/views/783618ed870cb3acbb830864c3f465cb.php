<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.markers.title'); ?>
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
    <?php if(session('status')): ?>
        <div class="alert alert-danger">
            <h5>The following postcode(s) are invalid:</h5>
            <?php $__currentLoopData = session('status'); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
             <?php echo e($error); ?><br>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </div>
    <?php endif; ?>
    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand"><?php echo app('translator')->get('main.markers.title'); ?></a>
                        <div class="hts-flash"></div>
                        <div class="btn-group">
                            <a class="btn btn-success btn-sm" data-toggle="modal" data-target="#importModal" href="javascript:void(0)">
                                Add Postcodes
                            </a>
                            
                            <a class="btn btn-danger btn-sm"  href="<?php echo e(route('markers.truncate')); ?>" onclick="return confirm('Are you sure you want to Clear all Map Data?');">
                                <i class="fa fa-trash"></i> Clear Data
                            </a>
                            <a class="btn btn-primary btn-sm" href="<?php echo e(route('markers.export',['type'=>'csv'])); ?>">
                                <?php echo app('translator')->get('app.export.csv'); ?>
                            </a>
                        </div>
                    </nav>
                </div>
                <div class="card-body" id="map" style="height: 600px">
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="importModal" tabindex="-1" aria-labelledby="importModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <form action="<?php echo e(route('markers.store')); ?>" method="post" class="form-horizontal">
                    <?php echo e(csrf_field()); ?>

                    <div class="modal-header">
                        <h5 class="modal-title" id="importModalLabel">Add Postcode</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="postcodes">Enter postcodes with line break</label>
                            <textarea class="form-control" name="postcodes" id="postcodes" rows="6" placeholder=""></textarea>
                        </div>
                        <p class="text-danger">It will take some time to process the postcode.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Save changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
<?php $__env->stopSection(); ?>
<?php $__env->startSection('scripts'); ?>;
<script src="http://maps.google.com/maps/api/js?key=<?php echo e(env('GOOGLE_API_KEY')); ?>&libraries=places&sensor=true"></script>
<script>

  <?php if(count($postcodes)>0): ?>
  var markers = [
    <?php $__currentLoopData = $postcodes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $postcode): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
    {
      "title": '<?php echo e($postcode->postcode); ?>',
      "lat": '<?php echo e($postcode->lat); ?>',
      "lng": '<?php echo e($postcode->lng); ?>'
    },
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
  ];
  <?php else: ?>
  var markers = [{
      "title": '',
      "lat": '',
      "lng": ''
    }];
  <?php endif; ?>
  window.onload = function () {
    LoadMap();
  }
  function LoadMap() {
    var mapOptions = {
      center: new google.maps.LatLng(markers[0].lat, markers[0].lng),
      zoom: 8,
      scrollwheel: true,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var infoWindow = new google.maps.InfoWindow();
    var latlngbounds = new google.maps.LatLngBounds();
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    for (var i = 0; i < markers.length; i++) {
      var data = markers[i]
      var myLatlng = new google.maps.LatLng(data.lat, data.lng);
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: data.title
      });
      (function (marker, data) {
        google.maps.event.addListener(marker, "click", function (e) {
          infoWindow.setContent('<div id="content">' +
            '<h5>Postcode</h5>' +
            '<h5>' + data.title + '</h5>' +
            '</div>');
          infoWindow.open(map, marker);
        });
      })(marker, data);
      latlngbounds.extend(marker.position);
    }
    var bounds = new google.maps.LatLngBounds();
    map.setCenter(latlngbounds.getCenter());
    map.fitBounds(latlngbounds);
  }
</script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/markers/map.blade.php ENDPATH**/ ?>