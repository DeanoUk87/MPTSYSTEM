<style>
    body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        color: #333;
    }

    .invoice-wrapper {
        width: 100%;
    }

    .header-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }

    .header-table td {
        vertical-align: top;
    }

    .company-name {
        font-size: 18px;
        font-weight: bold;
    }

    .document-title {
        font-size: 14px;
        margin-top: 4px;
        color: #555;
    }

    .statement-title {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin: 15px 0 5px 0;
    }

    .date-range {
        text-align: center;
        font-size: 12px;
        margin-bottom: 20px;
        color: #666;
    }

    .items-table {
        width: 100%;
        border-collapse: collapse;
    }

    .items-table th {
        background-color: #f2f2f2;
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
        font-weight: bold;
    }

    .items-table td {
        border: 1px solid #ccc;
        padding: 8px;
    }

    .text-right {
        text-align: right;
    }

    .total-row td {
        font-weight: bold;
        background-color: #f9f9f9;
    }

    .footer-note {
        margin-top: 25px;
        font-size: 10px;
        color: #777;
        text-align: center;
    }
</style>

<div class="invoice-wrapper">

    {{-- Header --}}
    <table class="header-table">
        <tr>
            <td width="50%">
                @if(file_exists(base_path('uploads').'/'.$userinfo->upload_logo))
                        <img class="file-width" src="{{ asset('uploads')}}/{{$userinfo->upload_logo}}" alt="logo" style="max-width:80px;">
                    @endif
            </td>
            <td width="50%" style="text-align: right;">
                <div class="company-name">
                    {{$userinfo->business_name}}
                </div>
                <div class="document-title">
                    Job Statement
                </div>
            </td>
        </tr>
    </table>

    {{-- Statement Title --}}
    <div class="statement-title">
        {{$driverName}} {{$customerName}} Statement
    </div>

    @if($dateFrom)
        <div class="date-range">
            From {{$dateFrom}} to {{$dateTo}}
        </div>
    @endif


    {{-- Items Table --}}
    <table class="items-table">
        <thead>
        <tr>
            <th width="20%">Job Ref</th>
            <th width="20%">Delivery Date</th>
            <th width="40%">Postcodes</th>
            <th width="20%" class="text-right">Driver Cost</th>
        </tr>
        </thead>
        <tbody>

        @php $total = 0; @endphp

        @foreach($booking as $row)

            @php
                $total += $row->driver_cost + $row->extra_cost;
                $viaAddresses = \App\Models\Viaaddress::where('job_ref',$row->job_ref)
                                ->whereNull('deleted_at')
                                ->orderBy('via_id')
                                ->get();
            @endphp

            <tr>
                <td>{{ $row->customerId }}-{{ $row->job_ref }}</td>

                <td>
                    {{ \Carbon\Carbon::parse($row->delivery_date, config('timezone'))->format('d M Y') }}
                </td>

                <td>
                    {{ $row->collection_postcode }},
                    {{ $row->delivery_postcode }}
                    @foreach($viaAddresses as $col)
                        @if($col->postcode), {{ $col->postcode }}@endif
                    @endforeach
                </td>

                <td class="text-right">
                    {!! env('CURRENCY_SYMBOL') !!}
                    {{ number_format($row->driver_cost + $row->extra_cost, 2) }}
                </td>
            </tr>

        @endforeach

        <tr class="total-row">
            <td colspan="3" class="text-right">
                TOTAL
            </td>
            <td class="text-right">
                {!! env('CURRENCY_SYMBOL') !!}
                {{ number_format($total, 2) }}
            </td>
        </tr>

        </tbody>
    </table>

    <div class="footer-note">
        Generated on {{ now()->format('d M Y H:i') }}
    </div>

</div>