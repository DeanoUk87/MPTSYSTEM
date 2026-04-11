@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Units
@endsection

@section('content')
    <div class="dashboard-stat">
        <div class="card-deck">
            <div class="card col-lg-12 px-0 mb-4">
                <div class="card-header">
                    <nav class="nav justify-content-between">
                        <div class="d-flex align-items-center">
                            <a class="navbar-brand mb-0 mr-3" href="{{ route('home') }}">
                                <i class="fa fa-drivers-license"></i> Bookings
                            </a>
                            <a class="btn btn-warning btn-sm active" href="{{ route('driver.units') }}">
                                <i class="fa fa-archive"></i> Units
                            </a>
                        </div>
                    </nav>
                </div>

                <div class="card-body">
                    @if($units->isEmpty())
                        <div class="text-center text-muted py-5">
                            <i class="fa fa-archive fa-3x mb-3"></i>
                            <p class="mb-0">No units are currently assigned to you.</p>
                        </div>
                    @else
                        <div class="row">
                            @foreach($units as $unit)
                                @php
                                    $type = strtolower($unit->unit_type ?? '');
                                    $isAmbient = str_contains($type, 'ambient');
                                    $isChill = str_contains($type, 'chill') || str_contains($type, 'freeze');
                                    $temp = $unit->liveTemperature;
                                    $tempDisplay = ($temp !== null) ? number_format((float)$temp, 1) . ' °C' : '-- °C';
                                    $headerBg  = $isChill ? 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)' : ($isAmbient ? 'linear-gradient(135deg,#b45309 0%,#f59e0b 100%)' : 'linear-gradient(135deg,#374151 0%,#6b7280 100%)');
                                    $bodyBg    = $isChill ? 'linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)' : ($isAmbient ? 'linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%)' : '#f3f4f6');
                                    $btnColor  = $isChill ? '#1d4ed8' : ($isAmbient ? '#b45309' : '#374151');
                                @endphp
                                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                                    <div style="border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.12); height:100%;">

                                        {{-- Unit header --}}
                                        <div style="background:{{ $headerBg }}; padding:14px 16px; color:#fff;">
                                            <div style="font-size:1.4rem; font-weight:800; letter-spacing:.02em;">
                                                {{ $unit->unit_number }}
                                            </div>
                                        </div>

                                        {{-- Temperature box --}}
                                        <div style="padding:16px 12px 8px; background:{{ $bodyBg }};">
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                @if($isChill)
                                                    <div style="flex:1; background:linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%); border:2px solid #3b82f6; border-radius:10px; padding:12px 8px; text-align:center; box-shadow:0 2px 8px rgba(59,130,246,.18);">
                                                        <div style="font-size:.55rem; font-weight:700; color:#1e3a8a; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px;">❄️ Chill</div>
                                                        <div style="font-size:1.6rem; font-weight:800; color:#1d4ed8; line-height:1;">{{ $tempDisplay }}</div>
                                                    </div>
                                                @elseif($isAmbient)
                                                    <div style="flex:1; background:linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%); border:2px solid #f59e0b; border-radius:10px; padding:12px 8px; text-align:center; box-shadow:0 2px 8px rgba(245,158,11,.18);">
                                                        <div style="font-size:.55rem; font-weight:700; color:#92400e; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px;">🌡 Ambient</div>
                                                        <div style="font-size:1.6rem; font-weight:800; color:#b45309; line-height:1;">{{ $tempDisplay }}</div>
                                                    </div>
                                                @else
                                                    <div style="flex:1; background:#e5e7eb; border:2px solid #9ca3af; border-radius:10px; padding:12px 8px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,.08);">
                                                        <div style="font-size:.55rem; font-weight:700; color:#374151; letter-spacing:.08em; text-transform:uppercase; margin-bottom:4px;">🌡 Temp</div>
                                                        <div style="font-size:1.6rem; font-weight:800; color:#374151; line-height:1;">{{ $tempDisplay }}</div>
                                                    </div>
                                                @endif
                                            </div>
                                        </div>



                                        {{-- View Location button --}}
                                        @if($unit->imei)
                                        <div style="padding:0 12px 12px; background:{{ $bodyBg }};">
                                            <button class="btn btn-sm btn-block view-location-btn"
                                                style="background:{{ $btnColor }}; color:#fff; border:none; border-radius:6px; font-size:.78rem; font-weight:600; padding:6px 0;"
                                                data-imei="{{ $unit->imei }}"
                                                data-unit="{{ $unit->unit_number }}">
                                                <i class="fa fa-map-marker"></i> View Location
                                            </button>
                                        </div>
                                        @endif
                                    </div>{{-- /card --}}
                                </div>{{-- /col --}}
                            @endforeach
                        </div>{{-- /row --}}

                        {{-- Unit Location Modal --}}
                        <div class="modal fade" id="unitLocationModal" tabindex="-1" role="dialog" aria-labelledby="unitLocationModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-lg" role="document">
                                <div class="modal-content">
                                    <div class="modal-header" style="background:#1d4ed8; color:#fff; padding:12px 16px;">
                                        <h5 class="modal-title" id="unitLocationModalLabel" style="font-weight:700; font-size:1rem;">
                                            <i class="fa fa-map-marker"></i> <span id="locationModalUnitName">Unit Location</span>
                                        </h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="color:#fff; opacity:1;">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body" style="padding:0;">
                                        <div id="locationModalStatus" style="display:none; padding:20px; text-align:center; color:#6b7280;"></div>
                                        <div id="unitLocationMap" style="width:100%; height:400px;"></div>
                                    </div>
                                    <div class="modal-footer" style="padding:8px 16px; font-size:.78rem; color:#6b7280;">
                                        <span id="locationModalAddress"></span>
                                        <button type="button" class="btn btn-sm btn-secondary ml-auto" data-dismiss="modal">Close</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="text-muted" style="font-size:.75rem; margin-top:8px;">
                            <i class="fa fa-refresh"></i> Temperature readings update automatically every 60 seconds.
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
    @parent
    <script>
    var unitLocationMap = null;
    var unitLocationMarker = null;

    $(document).on('click', '.view-location-btn', function () {
        var imei = $(this).data('imei');
        var unit = $(this).data('unit');

        $('#locationModalUnitName').text(unit + ' — Live Location');
        $('#locationModalAddress').text('');
        $('#unitLocationMap').hide();
        $('#locationModalStatus').text('Loading location...').show();
        $('#unitLocationModal').modal('show');

        $.getJSON('{{ url('/driver/unit-location') }}/' + encodeURIComponent(imei), function (data) {
            $('#locationModalStatus').hide();
            $('#unitLocationMap').show();

            if (unitLocationMap) {
                // Reuse existing map instance
                var pos = { lat: data.lat, lng: data.lng };
                unitLocationMap.setCenter(pos);
                unitLocationMap.setZoom(15);
                unitLocationMarker.setPosition(pos);
                unitLocationMarker.setTitle(data.unit_number);
            } else {
                var pos = { lat: data.lat, lng: data.lng };
                unitLocationMap = new google.maps.Map(document.getElementById('unitLocationMap'), {
                    center: pos,
                    zoom: 15,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                });
                unitLocationMarker = new google.maps.Marker({
                    position: pos,
                    map: unitLocationMap,
                    title: data.unit_number,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#1d4ed8',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                    },
                });
            }

            if (data.address) {
                $('#locationModalAddress').text(data.address);
            }
        }).fail(function (xhr) {
            var msg = (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : 'Location unavailable.';
            $('#locationModalStatus').text(msg);
        });
    });

    // Reset map when modal closes so next open triggers a fresh render
    $('#unitLocationModal').on('hidden.bs.modal', function () {
        unitLocationMap = null;
        unitLocationMarker = null;
        $('#unitLocationMap').html('').hide();
    });
    </script>
    @php
        $trackableImeis = $units->where('trackable', 1)->pluck('imei')->filter()->values();
    @endphp
    @if($trackableImeis->isNotEmpty())
    <style>
    #driverUnitAlertToast {
        display: none;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        min-width: 300px;
        max-width: 420px;
        background: #ff6f00;
        color: #fff;
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,.35);
        padding: 12px 16px 10px;
        font-size: 13px;
        line-height: 1.45;
    }
    #driverUnitAlertToast .toast-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 6px;
    }
    #driverUnitAlertToast .toast-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        padding: 0 0 0 10px;
    }
    #driverUnitAlertToast .toast-body p {
        margin: 2px 0;
    }
    </style>
    <div id="driverUnitAlertToast">
        <div class="toast-header">
            <span>&#9888; Unit Temperature Alert</span>
            <button class="toast-close" onclick="document.getElementById('driverUnitAlertToast').style.display='none'">&times;</button>
        </div>
        <div class="toast-body" id="driverUnitAlertBody"></div>
    </div>
    <script>
    (function () {
        var driverImeis = @json($trackableImeis);
        var POLL_INTERVAL = 90000;

        function checkDriverAlerts() {
            $.getJSON('{{ route('driver.storage.alerts') }}?_=' + Date.now(), function (res) {
                if (!res || !res.messages) return;
                var mine = res.messages.filter(function (msg) {
                    return driverImeis.some(function (imei) {
                        return msg.indexOf(imei) !== -1;
                    });
                });
                if (mine.length > 0) {
                    var html = '';
                    mine.forEach(function (msg) {
                        html += '<p>' + $('<div>').text(msg).html() + '</p>';
                    });
                    document.getElementById('driverUnitAlertBody').innerHTML = html;
                    document.getElementById('driverUnitAlertToast').style.display = 'block';
                    try {
                        var audio = new Audio('{{ asset('audio/notification.mp3') }}');
                        audio.play().catch(function(){});
                    } catch(e) {}
                }
            });
        }

        $(document).ready(function () {
            checkDriverAlerts();
            setInterval(checkDriverAlerts, POLL_INTERVAL);
        });
    })();
    </script>
    @endif
@endsection
