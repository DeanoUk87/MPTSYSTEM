<link rel="stylesheet" type="text/css" href="{{ asset('vendor/bootstrap4/css/bootstrap.min.css') }}"/>
<link rel="stylesheet" type="text/css" href="{{ asset('templates/admin/assets/css/invoice.css') }}"/>
<div id="invoice">
   <div style="width:100%; margin:0; padding:0;">
    <div style="width:100%; margin:0; padding:0;">
            <header>
                <div class="row">
                    <div class="col">
                        @if(file_exists(base_path('uploads').'/'.$booking->upload_logo))
                            <img class="file-width" src="{{ asset('uploads')}}/{{$booking->upload_logo}}" alt="logo" style="max-width:80px;">
                        @endif
                    </div>
					<table width="100%" cellpadding="0" cellspacing="0" style="margin:0; padding:0; font-size:11px;">
    <tr>
        <!-- Left side: Customer -->
        <td style="text-align:left; vertical-align:top;">
            <strong>Customer:</strong> {{$booking->customer}}
        </td>

        <!-- Right side: Job Ref and Mileage -->
        <td style="text-align:right; vertical-align:top;">
            <strong>Job Ref:</strong> {{$booking->customerId}}-{{$booking->job_ref}}<br>
            <strong>Mileage:</strong> {{$booking->miles}}
        </td>
    </tr>
</table>
                </div>
            </header>
            <main>
                <div style="margin:0; padding:0;">
                    
                       <table width="90%" style="font-size:11px; margin-top:16px; border-collapse:collapse;">

    {{-- ================= COLLECTION ================= --}}
    <tr>
        <td colspan="3" style="padding:10px 0;">
            <span style="font-weight:bold; font-size:12px;">Collection Details</span><br><br>

			@if($booking->collection_date)
                <strong>Date:</strong>
                {{ \Carbon\Carbon::parse($booking->collection_date, config('timezone'))->format('dS M Y') }}<br>
            @endif

            @if($booking->collection_time)<strong> Time:</strong>
                {{ \Carbon\Carbon::parse($booking->collection_time, config('timezone'))->format('H:ia') }}<br>
            @endif

			
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
    <div style="border-top:0.5px solid #000; width:100%; margin:12px 0;"></div>
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
				
				   @if($col->via_date)
                        <strong>Date:</strong>
                        {{ \Carbon\Carbon::parse($col->via_date, config('timezone'))->format('dS M Y') }}<br>
                    @endif

                    @if($col->via_time)
                        <strong>Time:</strong>
                        {{ \Carbon\Carbon::parse($col->via_time, config('timezone'))->format('H:ia') }}<br>
                    @endif

                    @if($col->name)
                        <strong>Name:</strong> {{$col->name}}<br>
                    @endif

                    @if($col->address1)
                        <strong>Address:</strong>
                        {{$col->address1}} {{$col->address2}},
                        {{$col->area}}, {{$col->postcode}}<br>
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
                            {{$order->order_number}}<br>
                            @if($order->ambience || $order->chill || $order->pump || $order->stores)
                            <div style="display:block; margin-top:2px; margin-bottom:4px;">
                                @if($order->ambience)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span>@endif
                                @if($order->chill)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span>@endif
                                @if($order->pump)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span>@endif
                                @if($order->stores)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span>@endif
                            </div>
                            @endif
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

			@if($booking->delivery_date)
                <strong>Date:</strong>
                {{ \Carbon\Carbon::parse($booking->delivery_date, config('timezone'))->format('dS M Y') }}<br>
            @endif

            @if($booking->delivery_time)<strong> Time:</strong>
                {{ \Carbon\Carbon::parse($booking->delivery_time, config('timezone'))->format('H:ia') }}<br>
            @endif

			
            @if($booking->delivery_name)
                <strong>Name:</strong> {{$booking->delivery_name}}<br>
            @endif

            @if($booking->delivery_address1)
                <strong>Address:</strong>
                {{$booking->delivery_address1}} {{$booking->delivery_address2}},
                {{$booking->delivery_area}}, {{$booking->delivery_postcode}}<br>
            @endif

            @if($booking->delivery_contact)
                <strong>Contact Name:</strong> {{$booking->delivery_contact}}<br>
            @endif

            @if($booking->delivery_phone)
                <strong>Tel Number:</strong> {{$booking->delivery_phone}}<br>
            @endif

		{{-- Collected Orders --}}
        @php
$orders = Helper::orderMain($booking->job_ref);
@endphp

 @if(count($orders))
    <strong>Collected Orders:</strong><br>

    @foreach($orders as $order)
        {{ $order->order_number }}<br>
        @if($order->ambience || $order->chill || $order->pump || $order->stores)
        <div style="display:block; margin-top:2px; margin-bottom:4px;">
            @if($order->ambience)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Amb</span>@endif
            @if($order->chill)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Chill</span>@endif
            @if($order->pump)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Pump</span>@endif
            @if($order->stores)<span style="display:inline-block; padding:1px 7px; border-radius:12px; font-size:10px; font-weight:700; color:#fff; background-color:#28a745;">Stores</span>@endif
        </div>
        @endif
    @endforeach
@endif
			 
            @if(!empty($booking->delivery_notes))
                <strong>Delivery Notes:</strong><br>
                {!! nl2br($booking->delivery_notes) !!}<br><br>
            @endif


            @if($booking->wait_and_return)
                <span style="color:red; font-weight:bold;">Wait and Return</span><br><br>
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
