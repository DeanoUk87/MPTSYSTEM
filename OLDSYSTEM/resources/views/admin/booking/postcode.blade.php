@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Booking Postcode Details
@endsection

@section('content')

{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-shared.css') }}">

<div class="bk-page">

    <div class="bk-card">

        {{-- ── Header ── --}}
        <div class="bk-card-header">
            <h1 class="bk-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Booking Postcode Details
            </h1>
            <div class="bk-card-header-actions">
                <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="bk-btn bk-btn-info bk-btn-sm">
                    ← @lang('app.goback')
                </a>
                <a href="{{\Illuminate\Support\Facades\URL::current().'?archive=0&state=1'}}" class="bk-btn bk-btn-danger bk-btn-sm">
                    📥 Export to Excel
                </a>
            </div>
        </div>

        {{-- ── Table ── --}}
        <div class="bk-card-body" style="padding:0;">
            <div class="bk-table-wrapper">
                <table id="booking_datatable" class="bk-table">
                    <thead>
                    <tr>
                        <th>@lang('main.booking.field.job_ref')</th>
                        <th>Postcodes</th>
                        <th>Mileage</th>
                        <th>Date</th>
                        <th>Vehicle</th>
                        <th>Extra Cost Information</th>
                        <th style="text-align:right;">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    @php $sumTotal = 0; @endphp
                    @foreach($booking as $row)
                        @php
                            $total = $row->cost + $row->extra_cost2;
                            $sumTotal += $total;
                            $viaAddresses = \App\Models\Viaaddress::where('job_ref', $row->job_ref)
                                ->whereNull('deleted_at')
                                ->orderBy('via_id')
                                ->get();
                        @endphp
                        <tr>
                            <td>{{ $row->customerId }}-{{ $row->job_ref }}</td>
                            <td>
                                @if(count($viaAddresses))
                                    @foreach($viaAddresses as $key => $col)
                                        @if($col->postcode){{$col->postcode}}, @endif
                                    @endforeach
                                @endif
                                {{ $row->delivery_postcode }}
                            </td>
                            <td>{{ $row->miles }}</td>
                            <td>{{\Carbon\Carbon::parse($row->delivery_date, config('timezone'))->format('d/m/Y')}}</td>
                            <td>{{ $row->vehicleName }}</td>
                            <td>{{ $row->manual_desc }}</td>
                            <td style="text-align:right;">
                                <span class="bk-cost-value text-success">{{env('CURRENCY_SYMBOL').number_format($total, 2)}}</span>
                            </td>
                        </tr>
                    @endforeach
                    <tr style="background:var(--surface-alt);">
                        <td colspan="6" style="text-align:right; font-weight:700; font-size:.85rem; color:var(--text-secondary);">TOTAL</td>
                        <td style="text-align:right;">
                            <span class="bk-cost-value text-success" style="font-size:1rem;">{{env('CURRENCY_SYMBOL').number_format($sumTotal, 2)}}</span>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>{{-- /bk-card --}}

</div>{{-- /bk-page --}}

@endsection
