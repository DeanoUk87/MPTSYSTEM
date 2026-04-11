@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Postcodes Summary
@endsection

@section('content')

{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-postcode-sum.css') }}">

<div class="booking-page-wrapper">

    {{-- ── Main Card ── --}}
    <div class="booking-main-card">

        {{-- ── Header ── --}}
        <div class="booking-header">
            <h1 class="booking-header-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Booking Postcode Summary
            </h1>
            <div class="booking-header-actions">
                <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="booking-btn booking-btn-info booking-btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12"/></svg>
                    @lang('app.goback')
                </a>
                <a href="{{\Illuminate\Support\Facades\URL::current().'?archive=0&state=1'}}" class="booking-btn booking-btn-success booking-btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Export to Excel
                </a>
            </div>
        </div>

        {{-- ── Body ── --}}
        <div class="booking-card-body">
            <div class="booking-table-wrapper">
                <table id="booking_datatable" class="booking-table table table-hover display nowrap table-bordered">
                    <thead>
                        <tr>
                            <th style="width: 30%">@lang('main.booking.field.job_ref')</th>
                            <th>Postcode Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($booking as $row)
                            @php
                                $viaSum=\App\Models\Viaaddress::where('job_ref',$row->job_ref)->whereNull('deleted_at')->count()+1;
                            @endphp
                            <tr>
                                <td>{{ $row->customerId }}-{{ $row->job_ref }}</td>
                                <td>{{ number_format($viaSum) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>

    </div>{{-- /booking-main-card --}}

</div>{{-- /booking-page-wrapper --}}

@endsection
