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

<?php
    $yesterday = \Carbon\Carbon::now(config('timezone'))->subDay()->format('Y-m-d');
    $today     = \Carbon\Carbon::now(config('timezone'))->format('Y-m-d');
    $tomorrow  = \Carbon\Carbon::now(config('timezone'))->addDay()->format('Y-m-d');
?>

<?php if(!Auth::user()->hasRole('driver')): ?>
<div class="bk-page">

    
    <div class="bk-card">

        
        <div class="bk-card-header">
            <h1 class="bk-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <?php if($driverName): ?><?php echo e($driverName); ?> <?php endif; ?>
                <?php if($customerName): ?><?php echo e($customerName); ?> <?php endif; ?>
                <?php if($fromDate == $today): ?> Today's
                <?php elseif($fromDate == $yesterday): ?> Yesterday's
                <?php elseif($fromDate == $tomorrow): ?> Tomorrow's
                <?php endif; ?>
                <?php echo app('translator')->get('main.booking.title'); ?>
            </h1>
            <div class="bk-card-header-actions">
                <div class="hts-flash"></div>

                <?php if($nextDayCount > 0): ?>
                    <a href="#" class="bk-btn bk-btn-danger bk-btn-sm" data-toggle="modal" data-target="#bookModalCenter">
                        ⚠ Job Important Notice!
                    </a>
                <?php endif; ?>

                <a class="bk-btn bk-btn-success bk-btn-sm" href="<?php echo e(route('booking.create')); ?>">
                    + <?php echo app('translator')->get('app.create'); ?>
                </a>
                <a class="bk-btn bk-btn-info bk-btn-sm" data-toggle="modal" data-target="#searchModal">
                    🔍 Custom Search
                </a>
                <a class="bk-btn bk-btn-warning bk-btn-sm" href="<?php echo e(route('booking.index',['user'=>$user, 'fromdate'=>0,'todate'=>0])); ?>">
                    ↻ All Jobs
                </a>
                <a class="bk-btn bk-btn-secondary bk-btn-sm" href="<?php echo e(route('booking.index',['user'=>$user, 'date1'=>$yesterday,'date2'=>$yesterday])); ?>">
                    📋 Yesterday
                </a>
                <a class="bk-btn bk-btn-secondary bk-btn-sm" href="<?php echo e(route('booking.index',['user'=>$user, 'date1'=>$today,'date2'=>$today])); ?>">
                    📋 Today
                </a>
                <a class="bk-btn bk-btn-secondary bk-btn-sm" href="<?php echo e(route('booking.index',['user'=>$user, 'date1'=>$tomorrow,'date2'=>$tomorrow])); ?>">
                    📋 Tomorrow
                </a>

                <?php if(!Auth::user()->hasRole('booking1')): ?>
                    <?php if($driver): ?>
                        <a class="bk-btn bk-btn-secondary bk-btn-sm" href="<?php echo e(route('booking.pdf.driver',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>0])); ?>" target="_blank">
                            📄 Driver Statement
                        </a>
                    <?php endif; ?>
                    <a class="bk-btn bk-btn-info bk-btn-sm" href="<?php echo e(route('booking.preview',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>2])); ?>" target="_blank">
                        📊 Financial Report
                    </a>

                    
                    <div class="dropdown" style="position:relative;">
                        <button class="bk-btn bk-btn-secondary bk-btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            ⚙ <?php echo app('translator')->get('app.options'); ?>
                        </button>
                        <div class="dropdown-menu dropfix" aria-labelledby="dropdownOptions">
                            <a class="dropdown-item" href="<?php echo e(route('booking.export',['type'=>'csv','user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>2])); ?>"><?php echo app('translator')->get('app.export.csv'); ?></a>
                            <a class="dropdown-item" href="<?php echo e(route('booking.pdf',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>2])); ?>"><?php echo app('translator')->get('app.export.pdf'); ?></a>
                            <a class="dropdown-item" href="<?php echo e(route('booking.postcode',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>0])); ?>">Postcodes</a>
                            <a class="dropdown-item" href="<?php echo e(route('booking.postcode.sum',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>0])); ?>">Postcodes Sum</a>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        
        <div class="bk-filter-bar">
            <form method="get" name="form1" class="form-horizontal bk-d-flex bk-align-center bk-gap-2 bk-flex-wrap" style="width:100%;" tabindex="1">
                <div class="bk-input-group" style="flex:1; min-width:280px; max-width:600px;">
                    <span class="bk-input-addon">📅</span>
                    <?php if($fromDate): ?>
                        <input type="text" class="bk-input date1" name="date1" value="<?php echo e(\Carbon\Carbon::parse($fromDate,config('timezone'))->format('d-m-Y')); ?>" placeholder="From date" style="max-width:120px;" />
                        <input type="text" class="bk-input date1" name="date2" value="<?php echo e(\Carbon\Carbon::parse($toDate,config('timezone'))->format('d-m-Y')); ?>" placeholder="To date" style="max-width:120px;" />
                    <?php else: ?>
                        <input type="text" class="bk-input date1" name="date1" placeholder="From date" style="max-width:120px;" />
                        <input type="text" class="bk-input date1" name="date2" placeholder="To date" style="max-width:120px;" />
                    <?php endif; ?>

                    <?php if(!$driver): ?>
                        <?php if($customer): ?>
                            <input id="customersAutocomplete" class="bk-input customer" value="<?php echo e($customerName); ?>" placeholder="Customer" style="max-width:160px;" />
                            <input id="customer_id" name="customer" value="<?php echo e($customer); ?>" type="hidden" />
                        <?php else: ?>
                            <input id="customersAutocomplete" class="bk-input customer" placeholder="Customer" style="max-width:160px;" />
                            <input id="customer_id" name="customer" type="hidden" />
                        <?php endif; ?>
                    <?php endif; ?>

                    <?php if(!$customer): ?>
                        <?php if($driver): ?>
                            <input id="driverAutocomplete" class="bk-input driver" value="<?php echo e($driverName); ?>" placeholder="Driver" style="max-width:160px;" />
                            <input id="driver_id" name="driver" value="<?php echo e($driver); ?>" type="hidden" />
                        <?php else: ?>
                            <input id="driverAutocomplete" class="bk-input driver" placeholder="Driver/SubCon/CXDriver" style="max-width:160px;" />
                            <input id="driver_id" name="driver" type="hidden" />
                        <?php endif; ?>
                    <?php endif; ?>
                </div>

                <button type="submit" value="1" class="bk-btn bk-btn-info" name="search">View</button>

                <?php if(request()->input('search') and $fromDate): ?>
                    <a href="<?php echo e(route('booking.multi.jobstatus',['date1'=>$fromDate,'date2'=>$toDate])); ?>"
                       onclick="return confirm('You are send this job to account?')"
                       class="bk-btn bk-btn-success">
                        ✓ Send to Acc
                    </a>
                <?php endif; ?>
            </form>
        </div>

        
        <div class="bk-card-body" style="padding:0;">
            <div class="table-responsive">
                <table id="booking_datatable" class="table table-hover display nowrap table-bordered" style="width:100%; border-spacing:0; font-size:11px;">
                    <thead>
                    <tr class="text-primary">
                        <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
                        <th>Date</th>
                        <th>Time</th>
                        <th><?php echo app('translator')->get('main.booking.field.customer'); ?></th>
                        <th>Collect</th>
                        <th>Via 1</th>
                        <th>Via 2</th>
                        <th>Via 3</th>
                        <th>Via 4</th>
                        <th>Via 5</th>
                        <th>Via 6</th>
                        <th>Delivery</th>
                        <th><?php echo app('translator')->get('main.booking.field.driver'); ?></th>
                        <?php if(!Auth::user()->hasRole('booking1')): ?>
                        <th>DriverCost</th>
                        <?php endif; ?>
                        <th><?php echo app('translator')->get('main.booking.field.vehicle'); ?></th>
                        <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions'])): ?>
                            <th>Total</th>
                        <?php endif; ?>
                        <th><?php echo app('translator')->get('main.booking.field.job_status'); ?></th>
                        <th>Mobile</th>
                        <th><?php echo app('translator')->get('app.actions'); ?></th>
                    </tr>
                    </thead>
                </table>
            </div>
        </div>

    </div>

    
    <?php if($nextDayCount > 0): ?>
        <div class="modal fade" id="bookModalCenter" tabindex="-1" role="dialog" aria-labelledby="bookModalCenterTitle" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="bookModalCenterTitle">⚠ Tomorrows Jobs Without Driver</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body pb-0">
                        <div class="table-responsive">
                            <table class="table table-sm table-light">
                                <thead>
                                <tr>
                                    <th><?php echo app('translator')->get('main.booking.field.job_ref'); ?></th>
                                    <th>Date</th>
                                    <th>Miles</th>
                                    <th>Quote</th>
                                </tr>
                                </thead>
                                <tbody>
                                <?php $__currentLoopData = $nextDay; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $booked): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                    <tr>
                                        <td><a href="<?php echo e(route('booking.edit',['id'=>$booked->job_ref])); ?>">Job-<?php echo e($booked->job_ref); ?></a></td>
                                        <td><?php echo e(\Carbon\Carbon::parse($booked->delivery_date,config('timezone'))->format('d-m-Y')); ?></td>
                                        <td><?php echo e($booked->miles); ?></td>
                                        <td><?php echo env('CURRENCY_SYMBOL'); ?><?php echo e($booked->cost); ?></td>
                                    </tr>
                                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    
    <div class="modal fade" id="searchModal" tabindex="-1" role="dialog" aria-labelledby="searchModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <form action="<?php echo e(route('booking.custom.search')); ?>" method="post" id="customSearch" name="customSearch">
                <?php echo e(csrf_field()); ?>

                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="searchModalTitle">🔍 Custom Search</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="bk-form-group">
                            <input name="search" class="bk-input" placeholder="Enter Job Ref, Postcode or Job Note" type="text" style="font-size:.9rem; height:40px;" />
                        </div>
                        <div class="bk-text-center bk-mb-2">
                            <button type="submit" class="bk-btn bk-btn-info bk-btn-lg" name="search">
                                🔍 Search
                            </button>
                        </div>
                        <div class="table-responsive pt-4">
                            <div class="hts-customSearch"></div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>

</div>
<?php endif; ?>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>;
<script type="text/javascript">
  var table = $('#booking_datatable').DataTable({
    processing: true,
    serverSide: true,
    iDisplayLength: 50,
    scrollX: true,
    bSort: false,
    "order": [[0, "desc"]],
    ajax: "<?php echo e(route('booking.search',['user'=>$user, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customer,'driver'=>$driver,'archive'=>0,'btype'=>0])); ?>",
    columns: [
      {data: 'job_ref',       name: 'job_ref'},
      {data: 'collection_date', name: 'collection_date'},
      {data: 'collection_time', name: 'collection_time'},
      {data: 'customerName',  name: 'customerName'},
      {data: 'from',          name: 'from'},
      {data: 'via1',          name: 'via1'},
      {data: 'via2',          name: 'via2'},
      {data: 'via3',          name: 'via3'},
      {data: 'via4',          name: 'via4'},
      {data: 'via5',          name: 'via5'},
      {data: 'via6',          name: 'via6'},
      {data: 'to',            name: 'to'},
      {data: 'driverName',    name: 'driverName'},
            <?php if(!Auth::user()->hasRole('booking1')): ?>
      {data: 'driverSum',     name: 'driverSum'},
            <?php endif; ?>
      {data: 'vehicleName',   name: 'vehicleName'},
            <?php if(Auth::user()->hasAnyPermission(['admin_roles_permissions'])): ?>
      {data: 'cost',          name: 'cost'},
            <?php endif; ?>
      {data: 'job_status',    name: 'job_status'},
      {data: 'locker',        name: 'locker'},
      {data: 'action',        name: 'action', orderable: false, searchable: false}
    ],
    "oLanguage": {
      "sStripClasses": "",
      "sSearch": '',
      "sSearchPlaceholder": "Search: JobRef, Postcode..."
    },
  });

  $('.customer').on('keyup input', function () { $(".driver").hide(); });
  $('.driver').on('keyup input',   function () { $(".customer").hide(); });

  $(document).ready(function () {
    $('#customSearch').on('submit', function (e) {
      e.preventDefault();
      $(".hts-customSearch").html('<div class="loader"></div>Searching database...');
      $(this).ajaxSubmit({
        target: '.hts-customSearch',
        success: searchSuccess,
        timeout: 10000
      });
    });
  });

  function searchSuccess(data) {
    $(".hts-customSearch").fadeIn('slow', function () {
      if (data.success === true) {
        $(".hts-customSearch").html('<div>' + data.message + '</div>');
      }
      if (data.error === true) {
        $(".hts-customSearch").html('<div class="bk-alert bk-alert-danger">' + data.message + '</div>');
      }
    });
  }
</script>
<?php echo $__env->make('partials.autocomplete', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>;
<?php echo $__env->make('partials.customjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>;
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/booking/index.blade.php ENDPATH**/ ?>