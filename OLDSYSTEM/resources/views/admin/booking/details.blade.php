@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Invoice
@endsection

@section('content')

    <div id="invoice">
        <div class="toolbar hidden-print">
            <div class="text-right">
                <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="btn btn-indigo btn-sm"><i class="fa fa-reply"></i> Go Back</a>
                <a href="{{route('booking.pdfdetails',['id'=>$booking->job_ref])}}" class="btn btn-info btn-sm"><i class="fa fa-file-pdf-o"></i> Export as PDF</a>
                <a href="#" title="Email" class="btn btn-default btn-sm" data-toggle="modal" data-target="#myModal"><i class="fa fa-print"></i> Email Job</a>
            </div>
            <hr>
        </div>
        <div class="invoice overflow-auto">
            <div style="min-width: 600px">
                <header>
                    <div class="row">
                        <div class="col">
                            @if(file_exists(base_path('uploads').'/'.$booking->upload_logo))
                                <img class="file-width" src="{{ asset('uploads')}}/{{$booking->upload_logo}}" alt="logo" style="width:100px;">
                            @endif
                        </div>
                        <div class="col company-details" style="font-size: 12px;">
                            <h5 class="name">
                                <a target="_blank" href="#">
                                    {{$booking->business_name}}
                                </a>
                            </h5>
                            <div style="font-size: 10px;">
                            <!-- {!! $booking->address_for_invoice !!} -->
                            </div>
                        </div>
                    </div>
                </header>
                <main>
                    <div class="row contacts" style="font-size: 12px;">
                        <div class="col invoice-to">
                            <div class="text-gray-light">CUSTOMER:</div>
                            <h5 class="to" style="font-size: 14px; font-weight: bold">{{$booking->customer}}</h5>
                            <div class="address">{{$booking->address}}, {{$booking->city}} {{$booking->postcode}}</div>
                            <div class="email"><a href="mailto:{{$booking->email}}">{{$booking->email}}</a></div>
                            <div class="address">{{$booking->phone}}</div>
                        </div>
                        <div class="col invoice-details">
                            <h5 class="invoice-id">Job Sheet # {{$booking->customerId}}-{{$booking->job_ref}}</h5>
                            <h6 class="miles">Mileage: {{$booking->miles}}</h6>

                        </div>
                    </div>

                   <div style="margin:0; padding:0;">
                    
                       <table width="90%" style="font-size:11px; margin-top:16px; border-collapse:collapse;">

    {{-- ================= COLLECTION ================= --}}
    <tr>
        <td colspan="3" style="padding:10px 0;">
            <span style="font-weight:bold; font-size:12px;">Collection Details</span><br><br>

            @if($booking->collection_name)
                <strong>Name:</strong> {{$booking->collection_name}}<br>
            @endif

            @if($booking->collection_address1)
                <strong>Address:</strong>
                {{$booking->collection_address1}},
                {{$booking->collection_address2}},
                {{$booking->collection_area}},
                {{$booking->collection_postcode}}<br>
            @endif

            @if($booking->collection_contact)
                <strong>Contact Name:</strong> {{$booking->collection_contact}}<br>
            @endif

            @if($booking->collection_phone)
                <strong>Tel Number:</strong> {{$booking->collection_phone}}<br>
            @endif

            @if($booking->number_of_items)
                <strong>No of Items:</strong> {{$booking->number_of_items}}<br>
            @endif

            @if($booking->weight)
                <strong>Weight:</strong> {{$booking->weight}}<br>
            @endif

            @if($booking->collection_notes)
                <strong>Collection Notes:</strong>
                {!! nl2br($booking->collection_notes) !!}<br>
            @endif
        </td>
    </tr>

    {{-- FULL WIDTH THIN LINE --}}
    <tr>
        <td colspan="3" style="padding:0;">
    <div style="border-top:0.5px solid #000; width:100%; margin:8px 0;"></div>
</td>
    </tr>

    {{-- ================= VIA ADDRESSES ================= --}}
    @if(!empty($viaAddresses) && count($viaAddresses) > 0)
        <tr>
            <td colspan="3" style="padding:10px 0;">

                @foreach($viaAddresses as $key => $col)

                    <span style="color:red; font-weight:bold;">
                        Via Address {{$key + 1}} ({{ strtoupper($col->via_type) }})
                    </span><br>

                    @if($col->name)
                        <strong>Name:</strong> {{$col->name}}<br>
                    @endif

                    @if($col->address1)
                        <strong>Address:</strong>
                        {{$col->address1}} {{$col->address2}},
                        {{$col->area}}, {{$col->postcode}}, {{$col->country}}<br>
                    @endif

                    @if($col->via_date)
                        <strong>Date:</strong>
                        {{ \Carbon\Carbon::parse($col->via_date, config('timezone'))->format('dS M Y') }}<br>
                    @endif

                    @if($col->via_time)
                        <strong>Est Del Time:</strong>
                        {{ \Carbon\Carbon::parse($col->via_time, config('timezone'))->format('H:ia') }}<br>
                    @endif

                    @if($col->contact)
                        <strong>Contact Name:</strong> {{$col->contact}}<br>
                    @endif

                    @if($col->phone)
                        <strong>Tel Number:</strong> {{$col->phone}}<br>
                    @endif

                    @if($col->notes)
                        <strong>Via Notes:</strong> {!! $col->notes !!}<br>
                    @endif

                    @php
                        $orders = Helper::orderVia($booking->job_ref,'via',$key+1);
                    @endphp

                    @if(count($orders) > 0)
                        <strong>Collected Orders:</strong><br>
                        @foreach($orders as $order)
                            {{$order->order_number}}
                            @if($order->ambience || $order->chill || $order->pump || $order->stores)
                            <span style="display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle;">
                                @if($order->ambience)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span>@endif
                                @if($order->chill)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span>@endif
                                @if($order->pump)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span>@endif
                                @if($order->stores)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span>@endif
                            </span>
                            @endif
                            <br>
                        @endforeach
                    @endif

                    <br>

                @endforeach

            </td>
        </tr>

        {{-- THIN LINE AFTER VIA --}}
        <tr>
            <td colspan="3" style="padding:0;">
                <div style="border-top:0.5px solid #000; width:100%;"></div>
            </td>
        </tr>
    @endif


    {{-- ================= DELIVERY ================= --}}
    <tr>
        <td colspan="3" style="padding:10px 0;">

            <span style="font-weight:bold; font-size:12px;">Delivery Details</span><br><br>

            @if($booking->delivery_name)
                <strong>Name:</strong> {{$booking->delivery_name}}<br>
            @endif

            @if($booking->delivery_address1)
                <strong>Address:</strong>
                {{$booking->delivery_address1}} {{$booking->delivery_address2}},
                {{$booking->delivery_area}}, {{$booking->delivery_postcode}}<br>
            @endif

            @if($booking->delivery_date)
                <strong>Date:</strong>
                {{ \Carbon\Carbon::parse($booking->delivery_date, config('timezone'))->format('dS M Y') }}<br>
            @endif

            @if($booking->delivery_time)
                <strong>Del Time:</strong>
                {{ \Carbon\Carbon::parse($booking->delivery_time, config('timezone'))->format('H:ia') }}<br>
            @endif

            @if($booking->delivery_contact)
                <strong>Contact Name:</strong> {{$booking->delivery_contact}}<br>
            @endif

            @if($booking->delivery_phone)
                <strong>Tel Number:</strong> {{$booking->delivery_phone}}<br>
            @endif
			
			@php
    $orders = Helper::orderMain($booking->job_ref);
@endphp

@if(count($orders) > 0)
    <strong>Collected Orders:</strong><br>

    @foreach($orders as $order)
        {{ $order->order_number }}
        @if($order->ambience || $order->chill || $order->pump || $order->stores)
        <span style="display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle;">
            @if($order->ambience)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span>@endif
            @if($order->chill)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span>@endif
            @if($order->pump)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span>@endif
            @if($order->stores)<span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span>@endif
        </span>
        @endif
        <br>
    @endforeach
@endif
			
			
			

            @if(!empty($booking->delivery_notes))
                <strong>Delivery Notes:</strong>
                {!! nl2br($booking->delivery_notes) !!}<br><br>
            @endif

            @if($booking->wait_and_return)
                <span style="color:red; font-weight:bold;">Wait and Return</span><br>
            @endif

            @if($booking->job_notes)
                <strong>Main Job / Driver Notes:</strong>
                {!! nl2br($booking->job_notes) !!}
            @endif

        </td>
    </tr>

</table>
                    
				</div>
                </main>
            </div>
        </div>
    </div>


    <form action="{{route('booking.mail')}}" method="post" name="hezecomform" id="hezecomform">
        {{ csrf_field() }}
        <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 class="modal-title" id="myModalLabel">Send job to email</h4>
                    </div>
                    <div class="modal-body">

                        <div class="hts-flash"></div>

                        <div class="form-group">
                            <input name="job_ref" type="hidden" value="{{$booking->job_ref}}" />
                            <div class="form-group">
                                @if($driver)
                                    <h5>Driver: {{$driver->driver}}</h5>
                                    <h5>Phone: {{$driver->driver_phone}}</h5>
                                    <input name="driver_email" class="form-control styler" type="text" value="{{$driver->driver_email}}" placeholder="Enter Driver Email" required/>
                                @else
                                    <p class="text-danger text-center">No driver contact details</p>
                                    <input name="driver_email" class="form-control styler" type="text" placeholder="Enter Driver Email" required/>
                                @endif
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        <input type="submit" name="button" id="hButton" class="btn btn-primary" value="Send Message" />
                        <div id="output"></div>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection
