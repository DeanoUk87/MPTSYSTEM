@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.dashboard')
@endsection

@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="dashboard-stat">
        @role('admin')
        <div class="row justify-content-center pb-5">
            <div class="col col-12 ">
                <form method="get" name="form1"  class="form-horizontal" tabindex="1">
                    <div class="row">
                        <div class="col-md-6 col-sx-12 ">
                            <div class="form-group">
                                <div class="input-group m-b">
                                    <span class="input-group-addon "><i class="fa fa-calendar fa fa-calendar"></i></span>
                                    @if($date1)
                                        <input type="text"  class="form-control date1" name="date1" value="{{$date1}}" />
                                        <input type="text"  class="form-control date1" name="date2" value="{{$date2}}" />
                                    @else
                                        <input type="text"  class="form-control date1" name="date1"  />
                                        <input type="text"  class="form-control date1" name="date2"  />
                                    @endif
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sx-12" style="padding-left:0;">
                            <button type="submit" class="btn btn-info" name="search">View</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        <div class="row">
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-danger">
                                    <i class="fa fa-user-circle highlight-icon blue" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                @role('admin')
                                <p class="card-text text-dark">Users</p>
                                <h5 class="bold-text">{{$users}}</h5>
                                @else
                                    <p class="card-text text-dark">Welcome</p>
                                    @endrole
                            </div>
                        </div>
                        <p class="text-muted">
                            @role('admin')
                            <i class="fa fa-exclamation-circle mr-1" aria-hidden="true"></i> Total Users
                            @else
                                <i class="fa fa-exclamation-circle mr-1" aria-hidden="true"></i> {{Auth::user()->name}}
                                @endrole
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-user highlight-icon purple" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Customers</p>
                                <h5 class="bold-text">{{$customers}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Customers
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics ">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-car highlight-icon light-green" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Vehicles</p>
                                <h5 class="bold-text">{{$vehicles}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Vehicles
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 col-sm-12 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-primary">
                                    <i class="fa fa-drivers-license highlight-icon indigo" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Drivers</p>
                                <h5 class="bold-text">{{$drivers}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-repeat mr-1" aria-hidden="true"></i> Total Drivers
                        </p>
                    </div>
                </div>
            </div>
        </div>
        @if($date1)
            <h5 class="text-danger text-center"> Reports from {{$date1}} - {{$date2}}</h5>
        @endif
        <div class="row">
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon orange" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Total Booking </p>
                                <h5 class="bold-text">{!! env('CURRENCY_SYMBOL') !!}{{number_format($booking,2)}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> Count: {{number_format($bookingCount)}}
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon blue" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Driver Cost</p>
                                <h5 class="bold-text">{!! env('CURRENCY_SYMBOL') !!}{{number_format(($driverCost+$subConCost+$cxDriverCost),2)}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> Drivers/SubCon
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 mb-3">
                <div class="card card-statistics">
                    <div class="card-body">
                        <div class="clearfix">
                            <div class="float-left">
                                <h4 class="text-warning">
                                    <i class="fa fa-money highlight-icon green" aria-hidden="true"></i>
                                </h4>
                            </div>
                            <div class="float-right">
                                <p class="card-text text-dark">Profit</p>
                                <h5 class="bold-text">{!! env('CURRENCY_SYMBOL') !!}{{number_format($profit,2)}}</h5>
                            </div>
                        </div>
                        <p class="text-muted">
                            <i class="fa fa-bookmark-o mr-1" aria-hidden="true"></i> All time profit
                        </p>
                    </div>
                </div>
            </div>
        </div><br>
        @endrole

        <div class="card-deck">
            <div class="card col-lg-12 px-0 mb-4">
                <div class="card-header">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand"><i class="fa fa-calendar"></i> Today's Booking</a>
                        <div class="btn-group">
                            <div class="dropdown">
                                @if(Auth::user()->hasAnyPermission(['admin_roles_permissions','booking_view','booking_create','booking_edit']))
                                    <a class="btn btn-sm btn-indigo" href="{{ route('booking.index',['user'=>0, 'date1'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'date2'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d')]) }}">
                                        <i class="fa fa-table"></i> Booking Area
                                    </a>
                                    <a class="btn btn-sm btn-danger" href="{{route('booking.create')}}">
                                        <i class="fa fa-plus"></i>  Start New Booking
                                    </a>
                                @endif
                            </div>
                        </div>
                    </nav>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table id="booking_datatable" class="table center-aligned-table">
                            <thead>
                            <tr class="text-primary">
                                <th>@lang('main.booking.field.job_ref')</th>
                                <th>From</th>
                                <th>To</th>
                                <th>@lang('main.booking.field.customer')</th>
                                <th>@lang('main.booking.field.driver')</th>
                                <th>@lang('main.booking.field.vehicle')</th>
                                @if(!Auth::user()->hasRole('booking1'))
                                    <th>Total</th>
                                @endif
                            </tr>
                            </thead>
                        </table>
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
        bSort: false,
        ajax: "{{ route('booking.search',['user'=>0, 'fromdate'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'todate'=>\Carbon\Carbon::now(config('timezone'))->format('Y-m-d'),'customer'=>0,'driver'=>0,'archive'=>0,'btype'=>0]) }}",
        columns: [
            {data: 'job_ref', name: 'job_ref'},
            {data: 'from', name: 'from'},
            {data: 'to', name: 'to'},
            {data: 'customerName', name: 'customerName'},
            {data: 'driverName', name: 'driverName'},
            {data: 'vehicleName', name: 'vehicleName'},
                @if(!Auth::user()->hasRole('booking1'))
            {data: 'cost', name: 'cost'},
            @endif
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
