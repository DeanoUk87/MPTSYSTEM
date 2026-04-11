
@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('main.booking.title')
@endsection

@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    @if (session('success'))
        <div class="alert alert-success">
            {{ session('success') }}
        </div>
    @endif
    @if (session('error'))
        <div class="alert alert-danger">
            {{ session('error') }}
        </div>
    @endif

    @php
        $yesterday = \Carbon\Carbon::now(config('timezone'))->subDay()->format('Y-m-d');
        $today = \Carbon\Carbon::now(config('timezone'))->format('Y-m-d');
        $tomorrow = \Carbon\Carbon::now(config('timezone'))->addDay()->format('Y-m-d');
    @endphp
    <style>
        table.table-bordered{
            border:1px solid #778899;
            margin-top:20px;
        }
        table.table-bordered > thead > tr > th{
            border:1px solid #778899;
        }
        table.table-bordered > tbody > tr > td{
            border:1px solid #778899;
        }
    </style>
    <div class="content-loader">
        {{--<form action="{{route('booking.deletemulti')}}" method="post" id="hezecomform" class="form-horizontal">
            {{ csrf_field() }}--}}
        <div class="row mb-2 htsDisplay">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <nav class="nav  justify-content-between">
                            <a class="navbar-brand">{{--{{ Auth::user()->name }}--}}
                                @if($fromDate ==$today) Today's
                                @elseif($fromDate ==$yesterday) Yesterday's
                                @elseif($fromDate ==$tomorrow) Tomorrow's
                                @endif @lang('main.booking.title')s </a>
                            <div class="hts-flash"></div>
                            <div class="btn-group">
                                <div class="dropdown">
                                    {{--<a class="btn btn-sm btn-warning" href="{{ route('home',['user'=>0, 'date1'=>0,'date2'=>0]) }}">
                                        <i class="fa fa-refresh"></i> All Jobs
                                    </a>--}}
                                    <a class="btn btn-sm btn-danger" href="{{ route('home',['user'=>0, 'date1'=>$today,'date2'=>$today]) }}">
                                        <i class="fa fa-tasks"></i> Today
                                    </a>
                                    <a class=" btn btn-indigo btn-sm" data-toggle="modal" data-target="#searchModal">
                                        <i class="fa fa-search"></i> Custom Search
                                    </a>
                                </div>
                            </div>
                        </nav>
                    </div>
                    <div class="vItems">
                        <div class="card-body" style="padding: 10px 0 10px 0">
                            <div class="col-md-12">
                                <form method="get" name="form1"  class="form-horizontal" tabindex="1">
                                    <div class="row">
                                        <div class="col-lg-6 col-md-9 col-sm-12">
                                            <div class="form-group">
                                                <div class="input-group m-b">
                                                    <span class="input-group-addon"><i class="fa fa-calendar fa fa-calendar"></i></span>
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
                                {{--table-responsive dt-responsive nowrap--}}
                                <table id="booking_datatable"  class="table table-hover display nowrap table-bordered" style="width: 100%; border-spacing: 0;">
                                    <thead>
                                    <tr class="text-primary">
                                        <th>@lang('main.booking.field.job_ref')</th>
                                        <th>Date</th>
                                        <th>Time Of Collection</th>
                                        <th>Collect</th>
                                        <th>Via 1</th>
                                        <th>Via 2</th>
                                        <th>Via 3</th>
                                        <th>Via 4</th>
                                        <th>Via 5</th>
                                        <th>Via 6</th>
                                        <th>Final Delivery</th>
                                        <th>Rough Eta (Final Delivery)</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {{--</form>--}}
    </div>

    {{-- Custom Search Modal --}}
    <div class="modal fade" id="searchModal" tabindex="-1" role="dialog" aria-labelledby="searchModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <form action="{{ route('booking.custom.search') }}" method="post" id="customSearch" name="customSearch">
                {{ csrf_field() }}
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="searchModalTitle">Custom Search</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="col-lg-12 text-center">
                            <div class="form-group">
                                <input name="search" class="form-control form-control-lg" placeholder="Ex: Enter Job Ref, Postcode or Job Note" type="text"/>
                            </div>
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="search">
                                <i class="fa fa-search"></i> Search
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
@endsection
@section('scripts');
<script type="text/javascript">
    var table = $('#booking_datatable').DataTable({
        processing: true,
        serverSide: true,
        iDisplayLength:25,
        scrollX: true,
        bSort: false,
        "order": [[0, "desc" ]],
        ajax: "{{ route('booking.search',['user'=>0, 'fromdate'=>$fromDate,'todate'=>$toDate, 'customer'=>$customerId,'driver'=>0,'archive'=>0,'btype'=>0]) }}",
        columns: [
            /*{data: 'checkbox', name: 'checkbox',orderable: false, searchable: false},*/
            {data: 'job_ref', name: 'job_ref'},
            {data: 'collection_date', name: 'collection_date'},
            {data: 'collection_time', name: 'collection_time'},
            {data: 'from', name: 'from'},
            {data: 'via1', name: 'via1'},
            {data: 'via2', name: 'via2'},
            {data: 'via3', name: 'via3'},
            {data: 'via4', name: 'via4'},
            {data: 'via5', name: 'via5'},
            {data: 'via6', name: 'via6'},
            {data: 'to', name: 'to'},
            {data: 'delivery_time', name: 'delivery_time'},
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "Search: JobRef,Postcode.."
        }
    });

    $('.customer').on('keyup input', function () {
        $(".driver").hide();
    });

    $('.driver').on('keyup input', function () {
        $(".customer").hide();
    });
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
        $(".hts-customSearch").fadeIn('slow', function(){
            if(data.success===true) {
                $(".hts-customSearch").html('<div>' + data.message + '</div>');
            }
            if(data.error===true) {
                $(".hts-customSearch").html('<div class="alert alert-danger">' + data.message + '</div>');
            }
        });
    }
</script>
<script type="text/javascript">
    setTimeout(function () { location.reload(true); }, {{env('REFRESH_URL_AFTER')*1000}}); //convert to milliseconds
</script>
@include('partials.autocomplete');
@include('partials.customjs');
@endsection
