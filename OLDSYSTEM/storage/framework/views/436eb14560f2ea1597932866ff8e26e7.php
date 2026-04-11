<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('main.storages.title'); ?>
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

    <div class="content-loader">
        <form action="<?php echo e(route('storages.deletemulti')); ?>" method="post" id="hezecomform" class="form-horizontal">
            <?php echo e(csrf_field()); ?>

            <div class="row mb-2 htsDisplay">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <nav class="nav  justify-content-between">
                                <a class="navbar-brand"><?php echo app('translator')->get('main.storages.title'); ?></a>
                                <div class="hts-flash"></div>
                                <div class="btn-group">
                                    <div class="dropdown">
                                        <a href="javascript:viod(0)" onclick="insertForm('<?php echo e(route('storages.create')); ?>')" class="btn btn-success btn-sm">
                                            <i class="fa fa-plus"></i> <?php echo app('translator')->get('main.storages.create'); ?>
                                        </a>
                                        <button type="submit" class="btnDelete btn btn-danger btn-sm" name="btn-delete" id="btnStatus" style="display: none">
                                            <span class="fa fa-trash"></span> <?php echo app('translator')->get('app.delete'); ?>
                                        </button>
                                    </div>
                                </div>
                            </nav>
                        </div>
                        <div class="vItems">
                            <div class="card-body" style="padding: 10px 0 10px 0">
                                <table id="storages_datatable"  class="table table-hover  table-responsive dt-responsive nowrap" cellspacing="0" style="width:100%">
                                    <thead>
                                    <tr class="text-primary">
                                        <th>Date</th>
                                        <th>IMEI</th>
                                        <th><?php echo app('translator')->get('main.storages.field.unit_number'); ?></th>
                                        <th><?php echo app('translator')->get('main.storages.field.unit_size'); ?></th>
                                        <th><?php echo app('translator')->get('main.storages.field.availability'); ?></th>
                                        <th><?php echo app('translator')->get('main.storages.field.unit_type'); ?></th>
                                        <th><?php echo app('translator')->get('main.storages.field.current_driver'); ?></th>
                                        <th><?php echo app('translator')->get('main.storages.field.calibration_date'); ?></th>
                                        <th>Expires</th>
                                        <th>Tracking</th>
                                        <th><?php echo app('translator')->get('app.actions'); ?></th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>

    
    <div class="modal fade" id="transferModal" tabindex="-1" role="dialog" aria-labelledby="transferModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="transferModalLabel">Transfer Unit</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="transferFlash"></div>
                    <p id="transferUnitInfo" class="text-muted" style="font-size:13px;"></p>

                    <div class="form-group">
                        <label style="font-weight:600; font-size:13px;">Search Driver / Sub-Contractor</label>
                        <input type="text" id="transferDriverSearch" class="form-control" placeholder="Type to search..." autocomplete="off" />
                        <input type="hidden" id="transferDriverId" />
                        <label style="display:block; margin-top:8px; font-size:12px; color:#444;">
                            <input type="checkbox" id="transferReplaceExisting" style="vertical-align:middle; margin-right:6px;">
                            Replace target driver's current units (keep only this transferred unit)
                        </label>
                        <small class="form-text text-muted">CX Drivers are not shown</small>
                    </div>

                    <div id="transferUnitsPanel" style="display:none; margin-top:12px;">
                        <p style="font-size:12px; font-weight:600; color:#666; margin-bottom:6px;">Units currently assigned to this driver:</p>
                        <div id="transferUnitsList" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <input type="hidden" id="transferUnitId" />
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="transferConfirmBtn">Transfer Unit</button>
                </div>
            </div>
        </div>
    </div>

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>;
<script type="text/javascript">
    var table = $('#storages_datatable').DataTable({
        processing: true,
        serverSide: true,
        iDisplayLength:25,
        "order": [[1, "asc" ]],
        ajax: "<?php echo e(route('storages.getdata')); ?>",
        columns: [
            {data: 'created_at', name: 'created_at'},
            {data: 'imei', name: 'imei'},
            {data: 'unit_number', name: 'unit_number'},
            {data: 'unit_size', name: 'unit_size'},
            {data: 'availability', name: 'availability'},
            {data: 'unit_type', name: 'unit_type'},
            {data: 'current_driver', name: 'current_driver'},
            {data: 'calibration_date', name: 'calibration_date'},
            {data: 'expires', name: 'expires'},
            {data: 'trackable', name: 'trackable'},
            {data: 'action', name: 'action', orderable: false, searchable: false}
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "<?php echo app('translator')->get('app.search'); ?>"
        }
    });

    /* ── Transfer Modal Logic ── */
    var allDrivers   = [];
    var allContacts  = [];
    var allUnits     = {};  // keyed by driver_id -> array of unit strings

    // Load drivers once on page load
    $.get('<?php echo e(route('storages.driversForTransfer')); ?>', function(data) {
        allDrivers  = data.drivers  || [];
        allContacts = data.contacts || [];
    });

    // Open transfer modal
    function openTransferModal(unitId, unitNumber, unitSize, currentDriver) {
        $('#transferUnitId').val(unitId);
        $('#transferDriverId').val('');
        $('#transferDriverSearch').val('');
        $('#transferReplaceExisting').prop('checked', false);
        $('#transferFlash').html('');
        $('#transferUnitsPanel').hide();
        $('#transferUnitsList').html('');
        $('#transferUnitInfo').text('Unit: ' + unitNumber + ' (' + unitSize + ')' + (currentDriver ? ' — currently with: ' + currentDriver : ''));
        $('#transferModal').modal('show');
    }

    // Autocomplete on the driver search box
    $(document).ready(function() {
        $('#transferDriverSearch').autocomplete({
            minLength: 0,
            appendTo: '#transferModal',
            source: function(request, response) {
                var term = request.term.toLowerCase();
                // Build combined list: main drivers + contacts, no CX
                var results = [];
                allDrivers.forEach(function(d) {
                    if (d.driver.toLowerCase().indexOf(term) !== -1) {
                        results.push({ label: d.driver + ' (' + d.driver_type + ')', value: d.driver, id: d.driver_id, type: 'driver' });
                    }
                });
                allContacts.forEach(function(c) {
                    if (c.driver_name.toLowerCase().indexOf(term) !== -1) {
                        results.push({ label: c.driver_name + ' (Contact)', value: c.driver_name, id: c.id, type: 'contact' });
                    }
                });
                response(results.slice(0, 25));
            },
            select: function(event, ui) {
                $('#transferDriverSearch').val(ui.item.value);
                $('#transferDriverId').val(ui.item.id);
                loadDriverUnits(ui.item.id);
                return false;
            }
        }).on('focus click', function() {
            if (!$(this).autocomplete('widget').is(':visible')) {
                $(this).autocomplete('search', $(this).val());
            }
        });

        // Transfer confirm button
        $('#transferConfirmBtn').on('click', function() {
            var unitId   = $('#transferUnitId').val();
            var driverId = $('#transferDriverId').val();
            var replaceExisting = $('#transferReplaceExisting').is(':checked') ? 1 : 0;
            if (!driverId) {
                $('#transferFlash').html('<div class="alert alert-warning">Please select a driver first.</div>');
                return;
            }
            var csrf = $('meta[name="csrf-token"]').attr('content');
            $('#transferConfirmBtn').prop('disabled', true);
            $.ajax({
                url: '/admin/storages/transfer/' + unitId,
                method: 'POST',
                data: { driver_id: driverId, replace_existing: replaceExisting, _token: csrf },
                success: function(res) {
                    if (res.success) {
                        $('#transferFlash').html('<div class="alert alert-success">Unit transferred successfully!</div>');
                        // Reload the driver's unit panel to show updated units
                        loadDriverUnits(driverId);
                        // Reload the datatable
                        table.ajax.reload(null, false);
                        setTimeout(function() {
                            $('#transferModal').modal('hide');
                            $('#transferConfirmBtn').prop('disabled', false);
                        }, 1500);
                    } else {
                        $('#transferFlash').html('<div class="alert alert-danger">' + res.message + '</div>');
                        $('#transferConfirmBtn').prop('disabled', false);
                    }
                },
                error: function() {
                    $('#transferFlash').html('<div class="alert alert-danger">An error occurred. Please try again.</div>');
                    $('#transferConfirmBtn').prop('disabled', false);
                }
            });
        });
    });

    // Load units currently assigned to selected driver via AJAX
    function loadDriverUnits(driverId) {
        $('#transferUnitsPanel').hide();
        $('#transferUnitsList').html('');
        if (!driverId) return;
        $.get('<?php echo e(route('storages.unitsByDriver')); ?>', { driver_id: driverId }, function(units) {
            if (units && units.length > 0) {
                var html = '';
                units.forEach(function(u) {
                    html += '<div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:4px;padding:4px 8px;font-size:11px;">'
                          + u.unit_number + ' (' + u.unit_size + ')'
                          + '</div>';
                });
                $('#transferUnitsList').html(html);
                $('#transferUnitsPanel').show();
            }
        });
    }
</script>
<?php echo $__env->make('partials.customjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>;
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/admin/storages/index.blade.php ENDPATH**/ ?>