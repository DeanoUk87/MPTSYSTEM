@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.dashboard')
@endsection

@section('content')
    <div class="dashboard-stat">
        <div class="card-deck">
            <div class="card col-lg-12 px-0 mb-4">
                <div class="card-header">
                    <nav class="nav  justify-content-between">
                        <div class="d-flex align-items-center">
                            <a class="navbar-brand mb-0 mr-3"><i class="fa fa-drivers-license"></i> Bookings</a>
                            <a class="btn btn-warning btn-sm" href="{{ route('driver.units') }}">
                                <i class="fa fa-archive"></i> Units
                            </a>
                        </div>
                        <div class="btn-group">
                            <div class="dropdown">
                                <button class="btn btn-info btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    <i class="fa fa-cog"></i> @lang('app.options')
                                </button>
                                <div class="dropdown-menu dropfix" aria-labelledby="dropdownOptions">
                                    <a class="dropdown-item" href="{{ route('booking.preview',['type'=>'csv','user'=>0, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>0,'driver'=>$driverId,'archive'=>0]) }}" target="_blank">Print</a>
                                    <a class="dropdown-item" href="{{route('booking.pdf',['user'=>0, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>0,'driver'=>$driverId,'archive'=>0])}}">@lang('app.export.pdf')</a>
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
                <div class="vItems">
                    <div class="card-body" style="padding: 10px 0 10px 0">
                        <div class="col-md-12">
                            <form method="get" name="form1"  class="form-horizontal" tabindex="1">
                                <div class="row mb-1">
                                    <div class="col-lg-5 col-md-9 col-sm-12">
                                        <div class="form-group">
                                            <div class="input-group">
                                                <span class="input-group-addon "><i class="fa fa-calendar fa fa-calendar"></i></span>
                                                @if($fromDate)
                                                    <input type="text"  class="form-control date1" name="date1" value="{{\Carbon\Carbon::parse($fromDate,config('timezone'))->format('d-m-Y')}}" />
                                                    <input type="text"  class="form-control date1" name="date2" value="{{\Carbon\Carbon::parse($toDate,config('timezone'))->format('d-m-Y')}}" />
                                                @else
                                                    <input type="text"  class="form-control date1" name="date1"  />
                                                    <input type="text"  class="form-control date1" name="date2"  />
                                                @endif
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-2" style="padding-left:0;">
                                        <button type="submit" class="btn btn-info" name="search">View</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="table-responsive">
                            <table id="booking_datatable"  class="table table-hover " cellspacing="0" style="width:100%;">
                                <thead>
                                <tr class="text-primary">
                                    <th>@lang('main.booking.field.job_ref')</th>
                                    <th>Date</th>
                                    <th>Collect</th>
                                    <th>Via 1</th>
                                    <th>Via 2</th>
                                    <th>Via 3</th>
                                    <th>Via 4</th>
                                    <th>Via 5</th>
                                    <th>Via 6</th>
                                    <th>Delivery</th>
                                    <th>Total</th>
                                </tr>
                                </thead>
                                <tfoot>
                                @php
                                    $driverCost=0;
                                @endphp
                                @foreach($booking as $row)
                                    @php
                                        $driverCost+= $row->driver_cost+$row->extra_cost;
                                    @endphp
                                @endforeach
                                <tr style="background: #F6F6F7;">
                                    <td colspan="10" style="text-align: right"><b>TOTAL</b></td>
                                    <td style="font-weight: bold">{{number_format($driverCost,2)}}</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {{--@else
        @include('sysadmin.profile.update')
    @endif--}}
@endsection


@section('scripts');
<script type="text/javascript">
    var table = $('#booking_datatable').DataTable({
        processing: true,
        serverSide: true,
        iDisplayLength:50,
        bSort: false,
        "order": [[0, "desc" ]],
        ajax: "{{ route('booking.search',['user'=>0, 'fromdate'=>$fromDate,'todate'=>$toDate,'customer'=>0,'driver'=>$driverId,'archive'=>0,'btype'=>0]) }}",
        columns: [
            {data: 'job_ref', name: 'job_ref'},
            {data: 'collection_date', name: 'collection_date'},

            {data: 'from', name: 'from'},
            {data: 'via1', name: 'via1'},
            {data: 'via2', name: 'via2'},
            {data: 'via3', name: 'via3'},
            {data: 'via4', name: 'via4'},
            {data: 'via5', name: 'via5'},
            {data: 'via6', name: 'via6'},
            {data: 'to', name: 'to'},
            {data: 'driverSum', name: 'driverSum'},
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "search"
        }
    });
</script>
@include('partials.customjs');
@endsection
