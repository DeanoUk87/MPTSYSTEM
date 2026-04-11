@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('main.booking.title')
@endsection

@section('content')

{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-edit.css') }}">
<style>
    .booking-toggle { position: relative; margin: 0; }
    .booking-toggle .form-check-input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }
    .booking-toggle .toggle-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        padding: 6px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #f8fafc;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.2;
        white-space: nowrap;
        transition: all .16s ease;
    }
    .booking-toggle .form-check-input:checked + .toggle-chip {
        background: #dcfce7;
        border-color: #16a34a;
        color: #166534;
    }
</style>

<div class="booking-page-wrapper">

    {{-- ── Flash Messages ── --}}
    @if (session('success'))
        <div class="booking-alert booking-alert-success">
            <span class="booking-alert-icon">✔</span>
            <span>{{ session('success') }}</span>
        </div>
    @endif
    @if (session('error'))
        <div class="booking-alert booking-alert-danger">
            <span class="booking-alert-icon">✖</span>
            <span>{{ session('error') }}</span>
        </div>
    @endif
    @if ($errors->any())
        <div class="booking-alert booking-alert-danger">
            <span class="booking-alert-icon">⚠</span>
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    @php
        $jobType = (int) ($booking->weekend ?? 0);
        if($jobType === 1){
            $rate_per_mile ='rate_per_mile_weekends';
        }else{
            $rate_per_mile ='rate_per_mile';
        }
    @endphp

    <form action="{{route('booking.update',['id'=>$booking->job_ref])}}" method="post" id="" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
        {{ csrf_field() }}
        <input type="hidden" name="job_ref" value="{{$booking->job_ref}}">

        {{-- ── Main Card ── --}}
        <div class="booking-main-card">

            {{-- ── Header ── --}}
            <div class="booking-header" style="position:relative;">
                <h1 class="booking-header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Job Ref {{$customers->account_number}}-{{$booking->job_ref}}
                    @if(count($addresses)>0)
                        <span class="booking-badge booking-badge-danger">{{count($addresses)}}</span>
                    @endif
                    @if($jobType === 1)
                        <span class="weekend-badge">⚡ Weekend / Bank Holiday</span>
                    @elseif($jobType === 2)
                        <span class="weekend-badge">🌙 Out Of Hours</span>
                    @endif
                </h1>
                <div class="booking-header-actions" style="position:absolute; left:50%; transform:translateX(-50%);">
                    <a class="booking-btn booking-btn-primary booking-btn-sm" href="{{route('booking.create')}}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        @lang('app.create') New
                    </a>

                </div>
            </div>

            {{-- ── Body ── --}}
            <div style="padding: 1.25rem;">
                <div class="hts-flash"></div>

                {{-- ── Row 1: Customer + Purchase Order ── --}}
                <div class="row mb-3">

                    {{-- Customer --}}
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="booking-section">
                            <div class="booking-section-header header-blue">
                                <span class="section-icon">👤</span>
                                @lang('main.booking.field.customer')
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-form-group">
                                    <div class="d-flex align-items-center gap-2 flex-wrap">
                                        <input id="customersAutocomplete"
                                               class="booking-input styler"
                                               type="text"
                                               value="{{$booking->customerName}}"
                                               placeholder="Customer Name"
                                               style="flex:1; min-width:0;"/>
                                        @if($customers && $customers->notes)
                                            <button type="button"
                                                    id="toggleNotesBtn"
                                                    onclick="toggleCustomerNotes()"
                                                    class="booking-btn booking-btn-danger booking-btn-sm">
                                                ⚠ View Notes
                                            </button>
                                        @endif
                                    </div>
                                    <input id="customer_id" name="customer" type="hidden" value="{{$booking->customer}}"/>
                                    @if($customers && $customers->notes)
                                        <div id="customerNotesContainer" class="customer-notes-panel">
                                            {!! $customers->notes !!}
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Purchase Order + Booked By --}}
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="booking-section">
                            <div class="booking-section-header header-blue">
                                <span class="section-icon">📋</span>
                                @lang('main.booking.field.purchase_order')
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="purchase_order">@lang('main.booking.field.purchase_order')</label>
                                        <input id="purchase_order"
                                               name="purchase_order"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="250"
                                               value="{{$booking->purchase_order}}"
                                               placeholder="@lang('main.booking.field.purchase_order')" />
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="booked_by">Booked By</label>
                                        <input name="booked_by"
                                               id="booked_by"
                                               class="booking-input styler"
                                               value="{{$booking->booked_by}}"
                                               type="text"
                                               placeholder="Booked By" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>{{-- /Row 1 --}}

                {{-- ── Row 2: Three-column layout ── --}}
                <div class="row">

                    {{-- ══ COLUMN 1: Collection ══ --}}
                    <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                        {{-- Collection Date / Time --}}
                        <div class="booking-section">
                            <div class="booking-section-header">
                                <span class="section-icon">📅</span>
                                Collection Date / Time
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_date">@lang('main.booking.field.collection_date')</label>
                                        <input id="collection_date"
                                               name="collection_date"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_date')"
                                               class="booking-input styler date1"
                                               value="{{\Carbon\Carbon::parse($booking->collection_date)->format('d-m-Y')}}"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_time">@lang('main.booking.field.collection_time')</label>
                                        <input id="collection_time"
                                               name="collection_time"
                                               class="booking-input styler timepicker2"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_time')"
                                               value="{{$booking->collection_time}}"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Collection Details --}}
                        <div class="booking-section">
                            <div class="booking-section-header">
                                <span class="section-icon">📦</span>
                                Collection Details
                            </div>
                            <div class="booking-section-body">

                                <div class="booking-form-group">
                                    <input name="collection_search"
                                           id="collection_search"
                                           class="booking-input styler"
                                           type="text"
                                           placeholder="@lang('main.booking.field.search')"
                                           autocomplete="off"/>
                                </div>

                                <div class="booking-form-group">
                                    <label class="booking-label sr-only" for="collection_name">@lang('main.booking.field.collection_name')</label>
                                    <input id="collectionAutocomplete"
                                           name="collection_name"
                                           class="booking-input styler"
                                           type="text"
                                           placeholder="@lang('main.booking.field.collection_name')"
                                           value="@if(old('collection_name')){{old('collection_name')}}@else{{$booking->collection_name}}@endif"
                                           autocomplete="off"
                                           required/>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_address1">@lang('main.booking.field.collection_address1')</label>
                                        <input id="collection_address1"
                                               name="collection_address1"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_address1')"
                                               value="@if(old('collection_address1')){{old('collection_address1')}}@else{{$booking->collection_address1}}@endif"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_address2">@lang('main.booking.field.collection_address2')</label>
                                        <input id="collection_address2"
                                               name="collection_address2"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_address2')"
                                               value="@if(old('collection_address2')){{old('collection_address2')}}@else{{$booking->collection_address2}}@endif"/>
                                    </div>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_area">@lang('main.booking.field.collection_area')</label>
                                        <input id="collection_area"
                                               name="collection_area"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_area')"
                                               value="@if(old('collection_area')){{old('collection_area')}}@else{{$booking->collection_area}}@endif"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_postcode">@lang('main.booking.field.collection_postcode')</label>
                                        <input id="collection_postcode"
                                               name="collection_postcode"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.collection_postcode')"
                                               value="@if(old('collection_postcode')){{old('collection_postcode')}}@else{{$booking->collection_postcode}}@endif"/>
                                    </div>
                                </div>

                                <div class="booking-form-group" style="display:none;">
                                    <label class="booking-label sr-only" for="collection_country">@lang('main.booking.field.collection_country')</label>
                                    <input id="collection_country"
                                           name="collection_country"
                                           class="booking-input styler"
                                           type="text"
                                           placeholder="@lang('main.booking.field.collection_country')"
                                           value="@if(old('collection_country')){{old('collection_country')}}@else{{$booking->collection_country}}@endif"/>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_contact">@lang('main.booking.field.contact')</label>
                                        <input id="collection_contact"
                                               name="collection_contact"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.contact')"
                                               value="@if(old('collection_contact')){{old('collection_contact')}}@else{{$booking->collection_contact}}@endif"
                                               autocomplete="off"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="collection_phone">@lang('main.booking.field.phone')</label>
                                        <input id="collection_phone"
                                               name="collection_phone"
                                               class="booking-input styler"
                                               type="text"
                                               placeholder="@lang('main.booking.field.phone')"
                                               value="@if(old('collection_phone')){{old('collection_phone')}}@else{{$booking->collection_phone}}@endif"/>
                                    </div>
                                </div>

                                <div class="booking-form-group">
                                    <label for="collection_notes" class="booking-label sr-only">@lang('main.booking.field.collection_notes')</label>
                                    <textarea class="booking-textarea styler"
                                              id="collection_notes"
                                              name="collection_notes"
                                              placeholder="@lang('main.booking.field.collection_notes')"
                                              rows="4">{{$booking->collection_notes}}</textarea>
                                </div>

                            </div>
                        </div>

                        {{-- Upload POD --}}
                        <div class="booking-section">
                            <div class="booking-section-header header-teal">
                                <span class="section-icon">📎</span>
                                Upload POD
                            </div>
                            <div class="booking-section-body">
                                @if(!$booking->pod_data_verify)
                                    <p class="text-center pt-3 lead">POD information uploaded but waiting for approval</p>
                                    <p class="text-center">
                                        <a href="{{route('booking.edit.pod',$booking->job_ref)}}" class="booking-btn booking-btn-danger booking-btn-lg">Click here to Approve</a>
                                    </p>
                                @else
                                    <div class="booking-form-group">
                                        <label class="booking-label" for="fileupload">@lang('app.multiupload')</label>
                                        <p><input type="file" id="fileupload" value="" name="filename[]" class="styler"/></p>
                                        <p><span id="addVar" class="booking-btn booking-btn-success booking-btn-sm">@lang('app.addfield')</span></p>
                                    </div>

                                    <div class="booking-form-group">
                                        <div class="row">
                                            @foreach($uploads as $upload)
                                                <div class="col-lg-4 col-sm-12" data-id="row-{{$upload->id}}">
                                                    <a href="{{ route('booking.download.pod',['file'=>$upload->filename])}}" class="d-block mb-4">
                                                        @if(file_exists(base_path('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')))
                                                            <img class="img-fluid img-thumbnail file-width lightbox" src="{{ asset('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')}}" alt="">
                                                        @else
                                                            <img class="img-fluid img-thumbnail file-width lightbox" src="{{ asset('templates/admin/images/icons/file.png')}}" alt="">
                                                        @endif
                                                    </a>
                                                    <a href="javascript:viod(0)" onclick="deleteFile('{{ url('admin/booking/deletefile2') }}','{{$upload->id}}')" class="booking-btn booking-btn-danger booking-btn-sm" style="position: absolute; top:2px; left:15px">
                                                        <i class="fa fa-trash fa-lg"></i>
                                                    </a>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>

                                    <div class="booking-form-group">
                                        <label for="office_notes" class="booking-label">@lang('main.booking.field.office_notes')</label>
                                        <textarea class="booking-textarea styler" id="office_notes" name="office_notes" rows="4">{{$booking->office_notes}}</textarea>
                                    </div>
                                    <div class="booking-form-group">
                                        <label for="driver_note" class="booking-label">Driver Note</label>
                                        <textarea class="booking-textarea styler" id="driver_note" name="driver_note" rows="4" readonly>{{$booking->driver_note}}</textarea>
                                    </div>
                                @endif
                            </div>
                        </div>

                    </div>{{-- /Column 1 --}}

                    {{-- ══ COLUMN 2: Mileage Calculator ══ --}}
                    <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                        <div class="booking-section">
                            <div class="booking-section-header header-purple">
                                <span class="section-icon">🗺</span>
                                Mileage Calculator
                            </div>
                            <div class="booking-section-body">

                                <div class="booking-form-group">
                                    <div id="map"></div>
                                </div>

                                <div class="booking-form-group">
                                    @if($rate1) {{$rate1->name}} = {{$rate1->$rate_per_mile}}/mile @endif
                                    <div id="customerRates"></div>
                                    <div class="rates-action-row">
                                        <a href="javascript:void(0)" class="booking-btn booking-btn-info booking-btn-sm refreshRates">↻ Refresh</a>
                                        <a href="javascript:void(0)" class="booking-btn booking-btn-success booking-btn-sm" data-toggle="modal" data-target="#customerModalRates">+ Add Rates</a>
                                    </div>
                                </div>

                                <div id="divRate">
                                    <input name="perMile" id="vehicleRate" class="booking-input" value="@if($rate1){{$rate1->$rate_per_mile}}@endif" style="display: none" type="text" readonly/>
                                    <input id="vehicleInfo" name="vehicleInfo" class="booking-input" value="@if($rate1){{$rate1->name}} = {{$rate1->$rate_per_mile}}@endif/mile " readonly required style="display: none"/>

                                    <div class="booking-form-group text-center">
                                        <div id="directions-panel"></div>
                                        <button type="button" id="submit" class="booking-btn booking-btn-danger w-100">
                                            📍 Get Mileage and Costs
                                        </button>
                                    </div>

                                    {{-- Miles --}}
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Miles</span>
                                            <input id="miles"
                                                   name="miles"
                                                   class="booking-input styler booking-cost-display text-info mileCost miles"
                                                   type="text"
                                                   value="{{$booking->miles}}"
                                                   placeholder="Enter Miles"/>
                                        </div>
                                        <div class="text-center mt-2">
                                            <span class="booking-label" id="totalTime" style="color:var(--warning);"></span>
                                        </div>
                                        <input name="time_covered" id="totalTimeVal" value="{{$booking->time_covered}}" type="hidden"/>
                                    </div>

                                    {{-- Quote --}}
                                    <div class="booking-form-group" style="{{$display}}">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Quote ({!! env('CURRENCY_SYMBOL') !!})</span>
                                            <input id="cost"
                                                   name="cost"
                                                   class="booking-input styler booking-cost-display text-success text-center totalCost costAdd"
                                                   type="text"
                                                   value="{{$booking->cost}}"
                                                   placeholder="Total Cost"/>
                                        </div>
                                    </div>

                                    {{-- Base cost before surcharge (used by JS to recalculate) --}}
                                    <input id="costCont" value="{{ number_format(max(0, $booking->cost - ($booking->fuel_surcharge_cost ?? 0)), 2, '.', '') }}" style="display:none"/>

                                    <input id="vehicle_id" name="vehicle" value="{{$booking->vehicle}}" style="display: none"/>
                                </div>{{-- /divRate --}}

                                {{-- Fuel Surcharge --}}
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">Fuel Surcharge</span>
                                        @php $fuelPpm = (int)($booking->fuel_surcharge_percent ?? 0); @endphp
                                        <select name="fuel_surcharge_percent" id="fuelSurcharge" class="booking-select styler">
                                            <option value="0"  @if($fuelPpm===0)  selected @endif>None (Up to £1.70/litre)</option>
                                            <option value="6"  @if($fuelPpm===6)  selected @endif>£1.71 – £1.79/litre (+6p/mile)</option>
                                            <option value="9"  @if($fuelPpm===9)  selected @endif>£1.80 – £1.89/litre (+9p/mile)</option>
                                            <option value="12" @if($fuelPpm===12) selected @endif>£1.90+/litre (+12p/mile)</option>
                                        </select>
                                    </div>
                                    <input class="fuel_surcharge_cost" name="fuel_surcharge_cost" value="{{$booking->fuel_surcharge_cost}}" style="display: none"/>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <input name="number_of_items"
                                               id="number_of_items"
                                               class="booking-input styler"
                                               value="{{$booking->number_of_items}}"
                                               type="text"
                                               placeholder="No. of Items"
                                               required/>
                                    </div>
                                    <div class="booking-form-group">
                                        <input name="weight"
                                               id="weight"
                                               class="booking-input styler"
                                               value="{{$booking->weight}}"
                                               type="text"
                                               placeholder="Weight (kg)"
                                               required/>
                                    </div>
                                </div>

                                <div class="booking-form-group">
                                    <select name="booking_type" id="booking_type" class="booking-select styler">
                                        <option value="{{$booking->booking_type}}">{{$booking->booking_type}}</option>
                                        @foreach($types as $type)
                                            <option value="{{$type->type_name}}">{{$type->type_name}}</option>
                                        @endforeach
                                    </select>
                                </div>

                                {{-- Rate Type: change Normal / Weekend / Out Of Hours and auto-reload rates --}}
                                @php $rateWeekendVal = $jobType === 1 ? 1 : ($jobType === 2 ? 3 : 2); @endphp
                                <input type="hidden" name="weekend" id="weekendValue" value="{{ $rateWeekendVal }}"/>
                                <input type="hidden" id="custIdForRates" value="{{ $booking->customer }}"/>
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">Rate Type</span>
                                        <select id="jobTypeChange" class="booking-select styler">
                                            <option value="2" @if($jobType === 0) selected @endif>Normal</option>
                                            <option value="1" @if($jobType === 1) selected @endif>Weekend / Bank Holiday</option>
                                            <option value="3" @if($jobType === 2) selected @endif>Out Of Hours</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="booking-row-2" style="{{$display}}">
                                    <div class="booking-form-group">
                                        <input name="manual_desc"
                                               class="booking-input styler"
                                               value="{{$booking->manual_desc}}"
                                               type="text"
                                               placeholder="Manual Job"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <input name="manual_amount"
                                               id="manual"
                                               class="booking-input styler"
                                               value="{{$booking->manual_amount}}"
                                               type="text"
                                               placeholder="Amount"/>
                                    </div>
                                    <div style="grid-column:1/-1;">
                                        <p class="text-center" style="font-size:.75rem; color:var(--text-muted);">To use the normal mileage, remove the manual job amount and click "Get Mileage and Costs" above</p>
                                    </div>
                                </div>

                                <div class="booking-form-group avoid-tolls-row" style="display:grid; grid-template-columns:repeat(2,minmax(210px,1fr)); gap:8px 14px; align-items:center; justify-items:start; max-width:560px; margin:0 auto;">
                                    <label class="booking-check booking-toggle">
                                        <input class="form-check-input" type="checkbox" name="avoid_tolls" value="1" id="avoidTolls" @if($booking->avoid_tolls===1) checked @endif>
                                        <span class="toggle-chip">Avoid Tolls</span>
                                    </label>
                                    <label class="booking-check booking-toggle">
                                        <input class="form-check-input" type="checkbox" name="new_mileage" value="1" id="new_mileage">
                                        <span class="toggle-chip">Apply New Mileage &amp; Cost</span>
                                    </label>
                                    <label class="booking-check booking-toggle">
                                        <input class="form-check-input" type="checkbox" name="wait_and_return" value="1" id="waitReturn" @if($booking->wait_and_return) checked @endif>
                                        <span class="toggle-chip">Wait and Return</span>
                                    </label>
                                    @if($customers->dead_mileage)
                                        <input name="dead_mileage" id="dead_mileage" value="{{$customers->dead_mileage}}" style="display: none">
                                        <label class="booking-check booking-toggle">
                                            <input class="form-check-input" type="checkbox" name="dead_mileage_status" value="1" id="deadMileage" @if($booking->dead_mileage_status) checked @endif>
                                            <span class="toggle-chip">Dead Mileage ({{$customers->dead_mileage}} miles)</span>
                                        </label>
                                    @endif
                                </div>

                            </div>
                        </div>

                        {{-- Profit + Job Notes --}}
                        <div class="booking-section">
                            <div class="booking-section-header header-green">
                                <span class="section-icon">💰</span>
                                Profit &amp; Notes
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-form-group" style="{{$display}}">
                                    <div class="booking-input-group profit-row" style="border:none; padding:0; background:transparent;">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon" style="background:var(--success-light); color:var(--success); font-weight:700;">PROFIT {!! env('CURRENCY_SYMBOL') !!}</span>
                                            <input id="profit"
                                                   name="profit"
                                                   type="text"
                                                   value="{{number_format(($booking->cost-$booking->driver_cost-$booking->extra_cost-$booking->cxdriver_cost+$booking->extra_cost2),2)}}"
                                                   class="booking-input booking-cost-display text-success text-center"
                                                   style="font-size: 18px; font-weight: bold"/>
                                        </div>
                                    </div>
                                </div>
                                <div class="booking-form-group">
                                    <label for="job_notes" class="booking-label sr-only">Job Notes</label>
                                    <textarea class="booking-textarea styler" id="job_notes" name="job_notes" placeholder="Job Notes" rows="4">{!! $booking->job_notes !!}</textarea>
                                </div>
                                <div style="display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.4rem;">
                                    <a href="#" class="booking-btn booking-btn-danger booking-btn-xs" data-toggle="modal" data-target="#bookModalCenter">📋 View Job Log</a>
                                    <a href="#" class="booking-btn booking-btn-info booking-btn-xs" data-toggle="modal" data-target="#bookModal">📄 Copy to New</a>
                                    <a href="#" class="booking-btn booking-btn-success booking-btn-xs similar" data-toggle="modal" data-target="#similarModalCenter">🔍 View Similar Jobs</a>
                                </div>
                            </div>
                        </div>

                    </div>{{-- /Column 2 --}}

                    {{-- ══ COLUMN 3: Delivery + Driver Cost + POD ══ --}}
                    <div class="col-lg-4 col-md-4 col-sm-6 mb-2">

                        {{-- Delivery Date / Time --}}
                        <div class="booking-section">
                            <div class="booking-section-header">
                                <span class="section-icon">📅</span>
                                Delivery Date / Time
                            </div>
                            <div class="booking-section-body">
                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_date">@lang('main.booking.field.delivery_date')</label>
                                        <input id="delivery_date"
                                               name="delivery_date"
                                               placeholder="@lang('main.booking.field.delivery_date')"
                                               class="booking-input styler date1"
                                               type="text"
                                               maxlength="20"
                                               value="{{\Carbon\Carbon::parse($booking->delivery_date)->format('d-m-Y')}}"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_time">@lang('main.booking.field.delivery_time')</label>
                                        <input id="delivery_time"
                                               name="delivery_time"
                                               placeholder="@lang('main.booking.field.delivery_time')"
                                               class="booking-input styler timepicker2"
                                               type="text"
                                               maxlength="30"
                                               value="{{$booking->delivery_time}}"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {{-- Delivery Address --}}
                        <div class="booking-section">
                            <div class="booking-section-header">
                                <span class="section-icon">🏠</span>
                                Delivery Address
                            </div>
                            <div class="booking-section-body">

                                <div class="booking-form-group">
                                    <input id="delivery_search"
                                           name="delivery_search"
                                           class="booking-input styler"
                                           type="text"
                                           placeholder="@lang('main.booking.field.search')"
                                           autocomplete="off"/>
                                </div>

                                <div class="booking-form-group">
                                    <label class="booking-label sr-only" for="delivery_name">@lang('main.booking.field.delivery_name')</label>
                                    <input id="deliveryAutocomplete"
                                           name="delivery_name"
                                           class="booking-input styler"
                                           type="text"
                                           placeholder="@lang('main.booking.field.delivery_name')"
                                           value="@if(old('delivery_name')){{old('delivery_name')}}@else{{$booking->delivery_name}}@endif"
                                           autocomplete="off"
                                           required/>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_address1">@lang('main.booking.field.delivery_address1')</label>
                                        <input id="delivery_address1"
                                               name="delivery_address1"
                                               placeholder="@lang('main.booking.field.delivery_address1')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="200"
                                               value="@if(old('delivery_address1')){{old('delivery_address1')}}@else{{$booking->delivery_address1}}@endif"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_address2">@lang('main.booking.field.delivery_address2')</label>
                                        <input id="delivery_address2"
                                               name="delivery_address2"
                                               placeholder="@lang('main.booking.field.delivery_address2')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="200"
                                               value="@if(old('delivery_address2')){{old('delivery_address2')}}@else{{$booking->delivery_address2}}@endif"/>
                                    </div>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_area">@lang('main.booking.field.delivery_area')</label>
                                        <input id="delivery_area"
                                               name="delivery_area"
                                               placeholder="@lang('main.booking.field.delivery_area')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="100"
                                               value="@if(old('delivery_area')){{old('delivery_area')}}@else{{$booking->delivery_area}}@endif"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_postcode">@lang('main.booking.field.delivery_postcode')</label>
                                        <input id="delivery_postcode"
                                               name="delivery_postcode"
                                               placeholder="@lang('main.booking.field.delivery_postcode')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="20"
                                               value="@if(old('delivery_postcode')){{old('delivery_postcode')}}@else{{$booking->delivery_postcode}}@endif"/>
                                    </div>
                                </div>

                                <div class="booking-form-group" style="display:none;">
                                    <label class="booking-label sr-only" for="delivery_country">@lang('main.booking.field.delivery_country')</label>
                                    <input id="delivery_country"
                                           name="delivery_country"
                                           placeholder="@lang('main.booking.field.delivery_country')"
                                           class="booking-input styler"
                                           type="text"
                                           maxlength="100"
                                           value="@if(old('delivery_country')){{old('delivery_country')}}@else{{$booking->delivery_country}}@endif"/>
                                </div>

                                <div class="booking-row-2">
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_contact">@lang('main.booking.field.contact')</label>
                                        <input id="delivery_contact"
                                               name="delivery_contact"
                                               placeholder="@lang('main.booking.field.contact')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="100"
                                               value="@if(old('delivery_contact')){{old('delivery_contact')}}@else{{$booking->delivery_contact}}@endif"/>
                                    </div>
                                    <div class="booking-form-group">
                                        <label class="booking-label sr-only" for="delivery_phone">@lang('main.booking.field.phone')</label>
                                        <input id="delivery_phone"
                                               name="delivery_phone"
                                               placeholder="@lang('main.booking.field.phone')"
                                               class="booking-input styler"
                                               type="text"
                                               maxlength="100"
                                               value="@if(old('delivery_phone')){{old('delivery_phone')}}@else{{$booking->delivery_phone}}@endif"/>
                                    </div>
                                </div>

                                {{-- Collected Orders Toggle --}}
                                <div class="booking-form-group">
                                    <button type="button"
                                            id="toggleCollectedOrdersBtn"
                                            data-default-label="{{ count($collectedOrdersMain) ? 'Show Collected Order Numbers' : '+ Add Collected Order Numbers' }}"
                                            onclick="toggleCollectedOrders()"
                                            class="booking-btn booking-btn-outline booking-btn-sm">
                                        {{ count($collectedOrdersMain) ? 'Show Collected Order Numbers' : '+ Add Collected Order Numbers' }}
                                    </button>
                                    <div id="collectedOrdersContainer" style="display:none; margin-top:.75rem;">
                                        @include('admin.collectedorders.main')
                                    </div>
                                </div>
                                {{-- End collected orders --}}

                                <div class="booking-form-group">
                                    <label for="delivery_notes" class="booking-label sr-only">@lang('main.booking.field.delivery_notes')</label>
                                    <textarea class="booking-textarea styler"
                                              id="delivery_notes"
                                              placeholder="@lang('main.booking.field.delivery_notes')"
                                              name="delivery_notes"
                                              rows="4">{{$booking->delivery_notes}}</textarea>
                                </div>

                            </div>
                        </div>

                        {{-- Driver Cost --}}
                        <div class="booking-section">
                            <div class="booking-section-header header-danger">
                                <span class="section-icon">🚗</span>
                                @if($jobType === 1)
                                    DRIVER COST (Weekend / Bank Holiday)
                                @elseif($jobType === 2)
                                    DRIVER COST (Out Of Hours)
                                @else
                                    DRIVER COST
                                @endif
                            </div>
                            <div class="booking-section-body" style="background: var(--purple-light);">

                                {{-- Driver --}}
                                <div class="booking-form-group">
                                    <div class="driver-row">
                                        <div class="booking-input-group" style="flex:1;">
                                            <span class="booking-input-addon">Driver</span>
                                            <select name="driverCost" id="driverCost" class="booking-select styler">
                                                @if($jobType === 1)
                                                    <option value="{{$booking->cost_per_mile_weekends}}|{{$booking->driverId}}|{{$booking->driver}}">@if($booking->driverName){{$booking->driverName}}= {{$booking->cost_per_mile_weekends}}/mile @else No Driver Attached Yet @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($drivers as $driver)
                                                        <option value="{{$driver->cost_per_mile_weekends}}|{{$driver->driver_id}}">{{$driver->driver}}= {{$driver->cost_per_mile_weekends}}/mile</option>
                                                    @endforeach
                                                @elseif($jobType === 2)
                                                    <option value="{{$booking->cost_per_mile_out_of_hours}}|{{$booking->driverId}}|{{$booking->driver}}">@if($booking->driverName){{$booking->driverName}}= {{$booking->cost_per_mile_out_of_hours}}/mile @else No Driver Attached Yet @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($drivers as $driver)
                                                        <option value="{{$driver->cost_per_mile_out_of_hours}}|{{$driver->driver_id}}">{{$driver->driver}}= {{$driver->cost_per_mile_out_of_hours}}/mile</option>
                                                    @endforeach
                                                @else
                                                    <option value="{{$booking->cost_per_mile}}|{{$booking->driverId}}|{{$booking->driver}}">@if($booking->driverName){{$booking->driverName}}= {{$booking->cost_per_mile}}/mile @else No Driver Attached Yet @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($drivers as $driver)
                                                        <option value="{{$driver->cost_per_mile}}|{{$driver->driver_id}}">{{$driver->driver}}= {{$driver->cost_per_mile}}/mile</option>
                                                    @endforeach
                                                @endif
                                            </select>
                                        </div>
                                        <div class="booking-input-group driver-cost-group" style="{{$display}}">
                                            <span class="booking-input-addon">{!! env('CURRENCY_SYMBOL') !!}</span>
                                            <input id="driverTotal" name="driver_cost" class="booking-input text-center text-danger newDriverTotal driver-cost-input" value="{{$booking->driver_cost}}"/>
                                        </div>
                                    </div>
                                    <input id="driverId" name="driver" value="{{$booking->driverId}}" style="display: none"/>
                                    <input id="driverPerMile" name="driverPerMile" value="{{ $jobType === 1 ? $booking->cost_per_mile_weekends : ($jobType === 2 ? $booking->cost_per_mile_out_of_hours : $booking->cost_per_mile) }}" style="display: none"/>
                                </div>

                                {{-- SubCon --}}
                                <div class="booking-form-group">
                                    <div class="driver-row">
                                        <div class="booking-input-group" style="flex:1;">
                                            <span class="booking-input-addon">SubCon</span>
                                            <select name="secondman" id="driverCost2" class="booking-select styler">
                                                @if($jobType === 1)
                                                    <option value="{{$booking->secondCostPerMileWeekends}}|{{$booking->second_man}}">@if($booking->secondMan){{$booking->secondMan}} @else No SubCon Attached @endif</option>
                                                    <option value="">No SubCon</option>
                                                    @foreach($secondMan as $second)
                                                        <option value="{{$second->cost_per_mile_weekends}}|{{$second->driver_id}}">{{$second->driver}}= {{$second->cost_per_mile_weekends}}/mile</option>
                                                    @endforeach
                                                @elseif($jobType === 2)
                                                    <option value="{{$booking->secondCostPerMileOutOfHours}}|{{$booking->second_man}}">@if($booking->secondMan){{$booking->secondMan}} @else No SubCon Attached @endif</option>
                                                    <option value="">No SubCon</option>
                                                    @foreach($secondMan as $second)
                                                        <option value="{{$second->cost_per_mile_out_of_hours}}|{{$second->driver_id}}">{{$second->driver}}= {{$second->cost_per_mile_out_of_hours}}/mile</option>
                                                    @endforeach
                                                @else
                                                    <option value="{{$booking->secondCostPerMile}}|{{$booking->second_man}}">@if($booking->secondMan){{$booking->secondMan}} @else No SubCon Attached @endif</option>
                                                    <option value="">No SubCon</option>
                                                    @foreach($secondMan as $second)
                                                        <option value="{{$second->cost_per_mile}}|{{$second->driver_id}}">{{$second->driver}}= {{$second->cost_per_mile}}/mile</option>
                                                    @endforeach
                                                @endif
                                            </select>
                                        </div>
                                        <div id="driverVal2" class="booking-input-group driver-cost-group" style="{{$display}}">
                                            <span class="booking-input-addon">{!! env('CURRENCY_SYMBOL') !!}</span>
                                            <input id="seconManCost" name="extra_cost" class="booking-input text-center text-danger driver-cost-input styler" value="{{$booking->extra_cost}}" autocomplete="off"/>
                                        </div>
                                    </div>
                                    <input id="driverId2" name="second_man" value="{{$booking->second_man}}" style="display: none">
                                </div>

                                {{-- Storage and Contact --}}
                                <div class="booking-form-group">
                                    <p id="driverContact"></p>
                                </div>
                                <div class="booking-form-group">
                                    <p id="unitStorage"></p>
                                </div>

                                {{-- CX Driver --}}
                                <div class="booking-form-group">
                                    <div class="driver-row">
                                        <div class="booking-input-group" style="flex:1;">
                                            <span class="booking-input-addon">CX Driver</span>
                                            <select name="cx_driver" id="driverCost3" class="booking-select styler">
                                                @if($jobType === 1)
                                                    <option value="{{$booking->cxCostPerMileWeekends}}|{{$booking->cxdriver}}">@if($booking->cxdriverName){{$booking->cxdriverName}}= {{$booking->cxCostPerMileWeekends}}/mile @else No Driver Attached @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($cxDriver as $cx)
                                                        <option value="{{$cx->cost_per_mile_weekends}}|{{$cx->driver_id}}">{{$cx->driver}}= {{$cx->cost_per_mile_weekends}}/mile</option>
                                                    @endforeach
                                                @elseif($jobType === 2)
                                                    <option value="{{$booking->cxCostPerMileOutOfHours}}|{{$booking->cxdriver}}">@if($booking->cxdriverName){{$booking->cxdriverName}}= {{$booking->cxCostPerMileOutOfHours}}/mile @else No Driver Attached @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($cxDriver as $cx)
                                                        <option value="{{$cx->cost_per_mile_out_of_hours}}|{{$cx->driver_id}}">{{$cx->driver}}= {{$cx->cost_per_mile_out_of_hours}}/mile</option>
                                                    @endforeach
                                                @else
                                                    <option value="{{$booking->cxCostPerMile}}|{{$booking->cxdriver}}">@if($booking->cxdriverName){{$booking->cxdriverName}}= {{$booking->cxCostPerMile}}/mile @else No Driver Attached @endif</option>
                                                    <option value="">No Driver</option>
                                                    @foreach($cxDriver as $cx)
                                                        <option value="{{$cx->cost_per_mile}}|{{$cx->driver_id}}">{{$cx->driver}}= {{$cx->cost_per_mile}}/mile</option>
                                                    @endforeach
                                                @endif
                                            </select>
                                        </div>
                                        <div id="driverVal3" class="booking-input-group driver-cost-group" style="{{$display}}">
                                            <span class="booking-input-addon">{!! env('CURRENCY_SYMBOL') !!}</span>
                                            <input id="cxDriverCost" name="cxdriver_cost" class="booking-input text-center text-danger driver-cost-input styler" value="{{$booking->cxdriver_cost}}" autocomplete="off"/>
                                        </div>
                                    </div>
                                    <input id="driverId3" name="cxdriver" value="{{$booking->cxdriver}}" style="display: none">
                                </div>

                                <div class="booking-form-group">
                                    <div class="d-flex flex-nowrap align-items-stretch" style="gap:4px; width:100%;">
                                        <button type="button" class="btn btn-info btn-sm" onclick="openAllUnitsModal()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                            <i class="fa fa-list"></i> Show All Units
                                        </button>
                                        <button type="button" class="btn btn-warning btn-sm" id="toggleTempTrackingBtn" onclick="toggleTempTracking()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                            Turn Off Temp Tracking
                                        </button>
                                        <button type="button" class="btn btn-secondary btn-sm" id="toggleMapTrackingBtn" onclick="toggleMapTracking()" style="flex:1 1 0; min-width:0; padding:2px 5px; font-size:11px; line-height:1.15; white-space:normal;">
                                            Turn Off Map
                                        </button>
                                    </div>
                                    <small id="trackingToggleMessage" class="d-block mt-2 text-muted"></small>
                                    <input type="hidden" id="hide_tracking_temperature" name="hide_tracking_temperature" value="{{ old('hide_tracking_temperature', (int) ($booking->hide_tracking_temperature ?? 0)) }}">
                                    <input type="hidden" id="hide_tracking_map" name="hide_tracking_map" value="{{ old('hide_tracking_map', (int) ($booking->hide_tracking_map ?? 0)) }}">
                                </div>

                                {{-- Extra Cost (hidden) --}}
                                <div class="row sr-only">
                                    <div class="col-md-7 col-xs-12">
                                        <div class="booking-form-group">
                                            <input name="extra_cost2_label" class="booking-input styler" value="{{$booking->extra_cost2_label}}" placeholder="Extra Cost"/>
                                        </div>
                                    </div>
                                    <div class="col-md-5 col-xs-12">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">{!! env('CURRENCY_SYMBOL') !!}</span>
                                            <input id="extraCost" name="extra_cost2" class="booking-input text-center text-success styler" value="{{$booking->extra_cost2}}" autocomplete="off"/>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {{-- POD Details --}}
                        @if($booking->pod_data_verify)
                            <div class="booking-section">
                                <div class="booking-section-header header-teal">
                                    <span class="section-icon">✅</span>
                                    POD Details
                                </div>
                                <div class="booking-section-body">
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">@lang('main.booking.field.pod_signature')</span>
                                            <label class="booking-label sr-only" for="pod_signature">@lang('main.booking.field.pod_signature')</label>
                                            <input id="pod_signature"
                                                   name="pod_signature"
                                                   class="booking-input styler"
                                                   type="text"
                                                   maxlength="100"
                                                   value="{{$booking->pod_signature}}"/>
                                        </div>
                                    </div>
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">Date</span>
                                            <label class="booking-label sr-only" for="pod_date">Date</label>
                                            <input id="pod_date"
                                                   name="pod_date"
                                                   class="booking-input styler date1"
                                                   type="text"
                                                   value="@if($booking->pod_date){{\Carbon\Carbon::parse($booking->pod_date)->format('d-m-Y')}}@endif"/>
                                        </div>
                                    </div>
                                    <div class="booking-form-group" style="z-index: 99999">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">@lang('main.booking.field.pod_time')</span>
                                            <label class="booking-label sr-only" for="pod_time">@lang('main.booking.field.pod_time')</label>
                                            <input id="pod_time"
                                                   name="pod_time"
                                                   class="booking-input styler timepicker2"
                                                   type="text"
                                                   maxlength="20"
                                                   value="{{$booking->pod_time}}"/>
                                        </div>
                                    </div>
                                    <div class="booking-form-group">
                                        <div class="booking-input-group">
                                            <span class="booking-input-addon">🌡 Temp</span>
                                            <label class="booking-label sr-only" for="delivered_temperature">Delivered Temperature</label>
                                            <input id="delivered_temperature"
                                                   name="delivered_temperature"
                                                   class="booking-input styler"
                                                   type="text"
                                                   maxlength="20"
                                                   value="{{$booking->delivered_temperature}}"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endif

                    </div>{{-- /Column 3 --}}

                </div>{{-- /Row 2 --}}

                {{-- ── Via Address Accordion ── --}}
                <div class="accordion" id="accordionExample">
                    <div class="row">
                        @includeIf('admin.viaaddress.formEdit')
                    </div>
                </div>

            </div>{{-- /card body --}}

        </div>{{-- /booking-main-card --}}

        {{-- ── Fixed Save Button ── --}}
        <div class="booking-save-btn-wrapper">
            <button type="submit" class="booking-btn-save" name="btn-save" id="btnStatus">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Update Changes
            </button>
        </div>

        {{-- ── Copy to New Modal ── --}}
        <div class="modal fade" id="bookModal" tabindex="-1" role="dialog" aria-labelledby="bookNew" aria-hidden="true">
            <div class="modal-dialog modal-md modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="bookNew">Copy to New Job</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body pb-0">
                        <div class="row">
                            <div class="col-lg-6 col-xs-12">
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">Collection Date</span>
                                        <input name="collectionDate" class="booking-input date1 styler" type="text" placeholder=""/>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 col-xs-12">
                                <div class="booking-form-group">
                                    <div class="booking-input-group">
                                        <span class="booking-input-addon">Delivery Date</span>
                                        <input name="deliveryDate" class="booking-input date1 styler" type="text" placeholder=""/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="booking-form-group text-center">
                            <input type="submit" name="copy" value="Copy and Create New Job" class="booking-btn booking-btn-danger">
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </form>

    {{-- ── All Units Modal ── --}}
    <div class="modal fade" id="allUnitsModal" tabindex="-1" role="dialog" aria-labelledby="allUnitsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header py-2">
                    <h5 class="modal-title" id="allUnitsModalLabel">All Storage Units</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="max-height:70vh; overflow:auto;">
                    <div id="allUnitsFlash"></div>
                    <div id="allUnitsGrid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:8px;"></div>

                    <div id="transferSection" style="display:none; margin-top:12px; border-top:1px solid #e9ecef; padding-top:12px;">
                        <div class="form-group mb-2">
                            <label style="font-size:12px; font-weight:600; margin-bottom:4px;">Transfer selected units to:</label>
                            <input type="text" id="transferDriverSearch" class="form-control form-control-sm" placeholder="Search driver/contact..." autocomplete="off">
                            <input type="hidden" id="transferDriverValue">
                        </div>
                        <div class="d-flex align-items-center" style="gap:8px;">
                            <button type="button" class="btn btn-warning btn-sm" id="doTransferBtn">
                                <i class="fa fa-exchange"></i> Transfer Units
                            </button>
                        </div>
                        <label style="display:block; margin:8px 0 4px; font-size:12px; color:#444;">
                            <input type="checkbox" id="replaceExistingUnits" style="vertical-align:middle; margin-right:6px;">
                            Replace target driver's current units (keep only selected units)
                        </label>
                        <small class="text-muted" style="font-size:11px;">CX Drivers are not shown. Select units above then pick a driver.</small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Job Log Modal ── --}}
    <div class="modal fade" id="bookModalCenter" tabindex="-1" role="dialog" aria-labelledby="bookModalCenterTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="bookModalCenterTitle">Job Ref {{$booking->job_ref}} Log</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body pb-0">
                    <div class="table-responsive">
                        <table class="table table-sm table-light">
                            <thead>
                            <tr>
                                <th scope="col">User</th>
                                <th scope="col">Date</th>
                                <th scope="col">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            @foreach($activities as $activity)
                                <tr>
                                    <td>{{$activity->username}}</td>
                                    <td>{{$activity->created_at}}</td>
                                    <td>{{$activity->subject}}</td>
                                </tr>
                            @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Similar Jobs Modal ── --}}
    <div class="modal fade" id="similarModalCenter" tabindex="-1" role="dialog" aria-labelledby="similarModalCenterTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="similarModalCenterTitle">Similar Jobs</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body pb-0">
                    <div class="table-responsive">
                        <div id="similarJobs"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Driver Contact Modal ── --}}
    <div class="modal fade" id="driverInfoModalCenter" tabindex="-1" role="dialog" aria-labelledby="driverInfoModalCenterTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="driverInfoModalCenterTitle">Driver Contact Details</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body text-center">
                    <div id="driverContactInfo"></div>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Customer Rates ── --}}
    @includeIf('admin.customervehiclerates.rates')



</div>{{-- /booking-page-wrapper --}}

{{-- ── Customer Notes Toggle Script ── --}}
@if($customers && $customers->notes)
<script>
function toggleCustomerNotes() {
    var container = document.getElementById('customerNotesContainer');
    var button = document.getElementById('toggleNotesBtn');
    if (container.style.display === "none") {
        container.style.display = "block";
        button.textContent = "✖ Hide Notes";
    } else {
        container.style.display = "none";
        button.textContent = "⚠ View Notes";
    }
}
</script>
@endif

{{-- ── Collected Orders Toggle Script ── --}}
<script>
function toggleCollectedOrders() {
    var container = document.getElementById('collectedOrdersContainer');
    var button = document.getElementById('toggleCollectedOrdersBtn');
    var defaultLabel = button.getAttribute('data-default-label') || '+ Add Collected Order Numbers';
    if (container.style.display === "none") {
        container.style.display = "block";
        button.textContent = "✖ Hide Collected Orders";
    } else {
        container.style.display = "none";
        button.textContent = defaultLabel;
    }
}
</script>

@endsection

@section('scripts')

    @include('partials.bookingjs')
    @include('partials.googleDirection')
    @include('partials.autocomplete')
    @include('admin.collectedorders.js')
    @php
        $hasPendingViaForTrackingLock = collect($addresses ?? [])->contains(function ($via) {
            return empty($via->signed_by);
        });
        $trackingPodComplete = (int) ($booking->pod_data_verify ?? 0) === 1
            && strlen(trim((string) ($booking->pod_signature ?? ''))) > 0
            && strlen(trim((string) ($booking->pod_time ?? ''))) > 0;
        $trackingVisibilityLocked = $trackingPodComplete && ! $hasPendingViaForTrackingLock;
    @endphp
    <script>
        var allDriverContactsList = [];
        var trackingVisibilityUrl = '{{ route('booking.tracking.visibility', ['id' => $booking->job_ref]) }}';
        var trackingLocked = "{{ $trackingVisibilityLocked ? 1 : 0 }}" === "1";

        function openAllUnitsModal() {
            $('#allUnitsFlash').html('');
            $('#transferSection').hide();
            $('#transferDriverSearch').val('');
            $('#transferDriverValue').val('');
            $('#replaceExistingUnits').prop('checked', false);
            loadUnits();
            $('#allUnitsModal').modal('show');
        }

        function loadUnits() {
            $('#allUnitsGrid').html('<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">Loading...</div>');
            $.getJSON('{{ route('booking.units.all') }}?_=' + Date.now(), function(units) {
                if (!units || units.length === 0) {
                    $('#allUnitsGrid').html('<div style="grid-column:1/-1;text-align:center;color:#999;padding:20px;">No units found.</div>');
                    return;
                }

                var html = '';
                units.forEach(function(u) {
                    var badge = u.availability === 'Yes'
                        ? '<span style="background:#c8e6c9;color:#2e7d32;padding:1px 6px;border-radius:3px;font-size:10px;">In Store</span>'
                        : '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:3px;font-size:10px;">Out</span>';
                    var driver = u.driver_label
                        ? '<span style="color:#555;font-size:11px;">' + $('<div>').text(u.driver_label).html() + '</span>'
                        : '<span style="color:#aaa;font-size:11px;">-</span>';
                    html += '<label style="display:flex;align-items:center;gap:6px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;padding:6px 8px;cursor:pointer;font-size:12px;margin:0;">'
                        + '<input type="checkbox" class="unit-check" value="' + u.id + '" style="margin:0;flex-shrink:0;" />'
                        + '<span style="font-weight:600;">' + $('<div>').text(u.unit_number).html() + '</span>'
                        + '<span style="color:#888;">(' + $('<div>').text(u.unit_size).html() + ')</span>'
                        + badge
                        + driver
                        + '</label>';
                });

                $('#allUnitsGrid').html(html);
                $('#allUnitsGrid').off('change.unitcheck').on('change.unitcheck', '.unit-check', function() {
                    var anyChecked = $('#allUnitsGrid .unit-check:checked').length > 0;
                    $('#transferSection').toggle(anyChecked);
                    if (anyChecked && allDriverContactsList.length === 0) {
                        loadContacts();
                    }
                });
            });
        }

        function loadContacts() {
            $.getJSON('{{ route('booking.units.contacts') }}', function(data) {
                allDriverContactsList = data || [];
                if ($('#transferDriverSearch').autocomplete('instance')) {
                    $('#transferDriverSearch').autocomplete('option', 'source', buildSource());
                }
            });
        }

        function buildSource() {
            return function(request, response) {
                var term = request.term.toLowerCase();
                var filtered = allDriverContactsList.filter(function(c) {
                    return c.label.toLowerCase().indexOf(term) !== -1;
                });
                response(filtered.slice(0, 30).map(function(c) {
                    return { label: c.label, value: c.label, driverValue: c.value };
                }));
            };
        }

        function applyTrackingToggleLabels() {
            var tempHidden = $('#hide_tracking_temperature').val() === '1';
            var mapHidden = $('#hide_tracking_map').val() === '1';

            $('#toggleTempTrackingBtn').text(tempHidden ? 'Turn On Temp Tracking' : 'Turn Off Temp Tracking');
            $('#toggleMapTrackingBtn').text(mapHidden ? 'Turn On Map' : 'Turn Off Map');
        }

        function setTrackingToggleMessage(message, isError) {
            var el = $('#trackingToggleMessage');
            el.text(message || '');
            el.removeClass('text-muted text-success text-danger');
            el.addClass(isError ? 'text-danger' : 'text-success');
        }

        function persistTrackingToggles() {
            if (trackingLocked) {
                setTrackingToggleMessage('Tracking visibility is locked because this job is completed.', true);
                applyTrackingToggleLabels();
                return;
            }

            $.ajax({
                url: trackingVisibilityUrl,
                method: 'POST',
                data: {
                    _token: '{{ csrf_token() }}',
                    hide_tracking_temperature: $('#hide_tracking_temperature').val(),
                    hide_tracking_map: $('#hide_tracking_map').val()
                },
                success: function (res) {
                    if (res && res.success) {
                        $('#hide_tracking_temperature').val(String(res.hide_tracking_temperature));
                        $('#hide_tracking_map').val(String(res.hide_tracking_map));
                        applyTrackingToggleLabels();
                        setTrackingToggleMessage('Tracking visibility updated for this job.', false);
                        return;
                    }

                    if (res && res.locked) {
                        trackingLocked = true;
                        setTrackingToggleMessage(res.message || 'Tracking visibility is locked for completed jobs.', true);
                        return;
                    }

                    setTrackingToggleMessage('Unable to update tracking visibility.', true);
                },
                error: function () {
                    setTrackingToggleMessage('Unable to update tracking visibility.', true);
                }
            });
        }

        function toggleTempTracking() {
            if (trackingLocked) {
                setTrackingToggleMessage('Tracking visibility is locked because this job is completed.', true);
                return;
            }
            var nextValue = $('#hide_tracking_temperature').val() === '1' ? '0' : '1';
            $('#hide_tracking_temperature').val(nextValue);
            applyTrackingToggleLabels();
            persistTrackingToggles();
        }

        function toggleMapTracking() {
            if (trackingLocked) {
                setTrackingToggleMessage('Tracking visibility is locked because this job is completed.', true);
                return;
            }
            var nextValue = $('#hide_tracking_map').val() === '1' ? '0' : '1';
            $('#hide_tracking_map').val(nextValue);
            applyTrackingToggleLabels();
            persistTrackingToggles();
        }

        $(document).ready(function () {
            applyTrackingToggleLabels();
            if (trackingLocked) {
                setTrackingToggleMessage('Tracking visibility is locked because this job is completed.', true);
            }

            $('#transferDriverSearch').autocomplete({
                minLength: 0,
                appendTo: '#allUnitsModal',
                source: buildSource(),
                select: function(event, ui) {
                    $('#transferDriverSearch').val(ui.item.label);
                    $('#transferDriverValue').val(ui.item.driverValue);
                    return false;
                }
            }).on('focus click', function() {
                if (allDriverContactsList.length === 0) loadContacts();
                if (!$(this).autocomplete('widget').is(':visible')) {
                    $(this).autocomplete('search', $(this).val());
                }
            });

            $('#doTransferBtn').on('click', function() {
                var unitIds = [];
                $('#allUnitsGrid .unit-check:checked').each(function() {
                    unitIds.push($(this).val());
                });
                var newDriver = $('#transferDriverValue').val();
                var replaceExisting = $('#replaceExistingUnits').is(':checked') ? 1 : 0;

                if (unitIds.length === 0) {
                    $('#allUnitsFlash').html('<div class="alert alert-warning alert-sm" style="padding:4px 8px;font-size:12px;">Select at least one unit.</div>');
                    return;
                }
                if (!newDriver) {
                    $('#allUnitsFlash').html('<div class="alert alert-warning alert-sm" style="padding:4px 8px;font-size:12px;">Select a driver to transfer to.</div>');
                    return;
                }

                $('#doTransferBtn').prop('disabled', true);
                $.ajax({
                    url: '{{ route('booking.units.transfer') }}',
                    method: 'POST',
                    data: { unit_ids: unitIds, new_driver: newDriver, replace_existing: replaceExisting, _token: '{{ csrf_token() }}' },
                    success: function(res) {
                        if (res && res.success) {
                            $('#allUnitsFlash').html('<div class="alert alert-success" style="padding:4px 8px;font-size:12px;">Units transferred successfully!</div>');
                            loadUnits();
                            // Refresh unit card(s) directly — do NOT trigger full change handlers
                            // because each handler clears the other driver's section.
                            var driverContactEl = document.getElementById('driverContact');
                            var unitStorageEl   = document.getElementById('unitStorage');
                            var oldDriverMaint  = (driverContactEl && driverContactEl.getAttribute('data-drivermain'));
                            var mainDriverId    = $('#driverId').val()
                                               || oldDriverMaint;
                            var contactId       = (unitStorageEl && unitStorageEl.getAttribute('data-subdriver'))
                                               || $('#driverInfo').val()
                                               || null;
                            var subConId        = (!mainDriverId) ? ($('#driverId2').val() || null) : null;

                            // If switching to a different main driver, clear unitStorage to prevent showing old driver's units
                            var driverChanged = (mainDriverId && oldDriverMaint && mainDriverId !== oldDriverMaint);
                            if (driverChanged) {
                                $('#unitStorage').html('');
                                if (unitStorageEl) unitStorageEl.setAttribute('data-subdriver', '');
                                contactId = null; // Don't use old contactId when switching drivers
                            }

                            if (mainDriverId) {
                                $.get('{{ route('booking.driver.contact') }}?driverMain=' + mainDriverId + '&jobId={{ $booking->job_ref }}&_=' + Date.now(), function(html) {
                                    $('#driverContact').html(html);
                                    if (driverContactEl) driverContactEl.setAttribute('data-drivermain', mainDriverId);
                                });
                            }
                            else if (subConId) {
                                $.get('{{ route('booking.driver.contact') }}?driver=' + subConId + '&jobId={{ $booking->job_ref }}&_=' + Date.now(), function(html) {
                                    $('#driverContact').html(html);
                                    if (!contactId) {
                                        var selectedContactId = $('#driverInfo').val();
                                        if (selectedContactId) {
                                            $.get('{{ route('booking.driver.contact') }}?subDriver=' + selectedContactId + '&jobId={{ $booking->job_ref }}&_=' + Date.now(), function(unitHtml) {
                                                $('#unitStorage').html(unitHtml);
                                                if (unitStorageEl) unitStorageEl.setAttribute('data-subdriver', selectedContactId);
                                            });
                                        }
                                    }
                                });
                            }

                            if (contactId) {
                                $.get('{{ route('booking.driver.contact') }}?subDriver=' + contactId + '&jobId={{ $booking->job_ref }}&_=' + Date.now(), function(html) {
                                    $('#unitStorage').html(html);
                                    if (unitStorageEl) unitStorageEl.setAttribute('data-subdriver', contactId);
                                });
                            }
                        } else {
                            $('#allUnitsFlash').html('<div class="alert alert-danger" style="padding:4px 8px;font-size:12px;">' + (res && res.message ? res.message : 'Transfer failed.') + '</div>');
                        }
                        $('#doTransferBtn').prop('disabled', false);
                    },
                    error: function() {
                        $('#allUnitsFlash').html('<div class="alert alert-danger" style="padding:4px 8px;font-size:12px;">Transfer failed.</div>');
                        $('#doTransferBtn').prop('disabled', false);
                    }
                });
            });
        });
    </script>
    <script>
        var heartbeatUrl = '{{ route('booking.edit.heartbeat', ['id' => $booking->job_ref]) }}';
        var releaseUrl   = '{{ route('booking.edit.release',   ['id' => $booking->job_ref]) }}';
        var csrfToken    = '{{ csrf_token() }}';
        var heartbeatTimer = null;
        var lockReleased = false;

        function sendHeartbeat() {
            fetch(heartbeatUrl, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
                keepalive: true
            }).then(function (res) {
                if (res.status === 423) {
                    return res.json().then(function (data) {
                        if (data && data.redirect) {
                            window.location.href = data.redirect;
                        }
                    });
                }

                return res.json().then(function (data) {
                    if (!data || !data.ok) {
                        return;
                    }

                    if (data.pending) {
                        showAccessPrompt(data.pending);
                    } else {
                        hideAccessPrompt();
                    }
                });
            }).catch(function () {
                // Keep editor page stable even if heartbeat response parsing fails.
            });
        }

        function startHeartbeat() {
            clearInterval(heartbeatTimer);
            sendHeartbeat();
            heartbeatTimer = setInterval(sendHeartbeat, 30000);
        }

        // Release the lock when the user leaves the page
        // sendBeacon sends a FormData body which Laravel reads as POST
        function releaseLock() {
            if (lockReleased) {
                return;
            }
            lockReleased = true;
            clearInterval(heartbeatTimer);
            var fd = new FormData();
            fd.append('_token', csrfToken);
            if (navigator.sendBeacon) {
                navigator.sendBeacon(releaseUrl, fd);
            } else {
                fetch(releaseUrl, {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' },
                    keepalive: true
                });
            }
        }

        // Start lock heartbeat as soon as edit page is active
        startHeartbeat();

        window.addEventListener('beforeunload', releaseLock);
        window.addEventListener('pagehide',     releaseLock);

        // Release lock when navigating away using links/forms inside the app
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href]');
            if (!a) {
                return;
            }
            var href = a.getAttribute('href') || '';
            if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) {
                return;
            }
            releaseLock();
        }, true);

        document.addEventListener('submit', function () {
            releaseLock();
        }, true);

        // Pause/resume heartbeat when tab is hidden/visible
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                releaseLock();
            } else {
                // Re-acquire the lock when returning to the tab
                lockReleased = false;
                startHeartbeat();
            }
        });
    </script>
    <script>
        var accessRequestsUrl = '{{ route('booking.edit.requests', ['id' => $booking->job_ref]) }}';
        var accessRespondBase = '{{ url('admin/booking/edit/access-requests/'.$booking->job_ref) }}';
        var accessPromptEl = null;
        var accessPromptRequestId = null;

        function ensureAccessPrompt() {
            if (accessPromptEl) {
                return accessPromptEl;
            }

            var wrapper = document.createElement('div');
            wrapper.id = 'job-access-request-popup';
            wrapper.style.position = 'fixed';
            wrapper.style.right = '20px';
            wrapper.style.bottom = '20px';
            wrapper.style.zIndex = '9999';
            wrapper.style.maxWidth = '360px';
            wrapper.style.padding = '14px';
            wrapper.style.background = '#fff';
            wrapper.style.border = '1px solid #d1d5db';
            wrapper.style.borderRadius = '8px';
            wrapper.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)';
            wrapper.style.display = 'none';
            wrapper.innerHTML = '' +
                '<div style="font-weight:700; margin-bottom:6px;">Access Request</div>' +
                '<div id="job-access-request-text" style="font-size:13px; margin-bottom:10px;"></div>' +
                '<div style="display:flex; gap:8px; justify-content:flex-end;">' +
                    '<button id="job-access-decline" type="button" class="btn btn-outline-secondary btn-sm">Decline</button>' +
                    '<button id="job-access-allow" type="button" class="btn btn-success btn-sm">Allow Access</button>' +
                '</div>';

            document.body.appendChild(wrapper);

            wrapper.querySelector('#job-access-allow').addEventListener('click', function () {
                respondToAccessRequest('allow');
            });

            wrapper.querySelector('#job-access-decline').addEventListener('click', function () {
                respondToAccessRequest('decline');
            });

            accessPromptEl = wrapper;
            return accessPromptEl;
        }

        function showAccessPrompt(requestInfo) {
            var popup = ensureAccessPrompt();
            accessPromptRequestId = requestInfo.id;
            var textEl = popup.querySelector('#job-access-request-text');
            textEl.textContent = requestInfo.name + ' wants access to this job.';
            popup.style.display = 'block';
        }

        function hideAccessPrompt() {
            if (!accessPromptEl) {
                return;
            }
            accessPromptRequestId = null;
            accessPromptEl.style.display = 'none';
        }

        function respondToAccessRequest(action) {
            if (!accessPromptRequestId) {
                return;
            }

            fetch(accessRespondBase + '/' + accessPromptRequestId, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: action })
            })
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.ok) {
                    return;
                }

                if (action === 'allow' && data.redirect_editor) {
                    window.location.href = data.redirect_editor;
                    return;
                }

                hideAccessPrompt();
            });
        }

        function pollAccessRequests() {
            fetch(accessRequestsUrl, {
                headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' }
            })
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                if (!data || !data.ok) {
                    return;
                }

                if (data.forced_out && data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }

                if (data.pending) {
                    showAccessPrompt(data.pending);
                } else {
                    hideAccessPrompt();
                }
            })
            .catch(function () {
                // Secondary poll can fail silently because heartbeat already drives popup updates.
            });
        }

        pollAccessRequests();
        setInterval(pollAccessRequests, 5000);
    </script>
@endsection
