@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('main.booking.title')
@endsection

@section('content')

{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-shared.css') }}">

@if(session('success'))
    <div class="bk-alert bk-alert-success">
        <span class="bk-alert-icon">✔</span>
        <span>{{ session('success') }}</span>
    </div>
@endif
@if(session('error'))
    <div class="bk-alert bk-alert-danger">
        <span class="bk-alert-icon">✖</span>
        <span>{{ session('error') }}</span>
    </div>
@endif
@if($errors->any())
    <div class="bk-alert bk-alert-danger">
        <span class="bk-alert-icon">⚠</span>
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

@if(($booking->pod_data_verify && !$booking->pod_mobile) || (!$booking->pod_data_verify && $booking->pod_mobile))

<form action="{{route('booking.update.pod',['id'=>$booking->job_ref])}}" method="post" name="hezecomform"
      class="form-horizontal" enctype="multipart/form-data">
    {{ csrf_field() }}
    <input type="hidden" name="job_ref" value="{{$booking->job_ref}}">

    <div class="bk-page">

        <div class="bk-card">

            {{-- ── Header ── --}}
            <div class="bk-card-header header-teal">
                <h1 class="bk-card-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="opacity:.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Job Ref {{$customers->account_number}}-{{$booking->job_ref}} — POD Info
                    @if(count($addresses) > 0)
                        <span class="bk-badge bk-badge-danger">{{count($addresses)}}</span>
                    @endif
                </h1>
                <div class="bk-card-header-actions">
                    <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="bk-btn bk-btn-danger bk-btn-sm">
                        ← @lang('app.goback')
                    </a>
                </div>
            </div>

            <div class="bk-card-body">
                <div class="hts-flash"></div>

                <div class="row">

                    {{-- ── Upload POD ── --}}
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="bk-section">
                            <div class="bk-section-header header-teal">
                                <span class="section-icon">📎</span>
                                Upload POD
                            </div>
                            <div class="bk-section-body">

                                <div class="bk-pod-upload-area">
                                    <input type="file" id="fileupload" value="" name="filename[]" class="styler" />
                                    <span id="addVar" class="bk-btn bk-btn-success bk-btn-sm" style="align-self:flex-start;">
                                        + @lang('app.addfield')
                                    </span>
                                </div>

                                {{-- Existing uploads --}}
                                @if(count($uploads))
                                    <div class="bk-pod-preview bk-mt-2">
                                        @foreach($uploads as $upload)
                                            <div style="position:relative;" data-id="row-{{$upload->id}}">
                                                <a href="{{ route('booking.download.pod',['file'=>$upload->filename])}}" class="d-block">
                                                    @if(file_exists(base_path('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')))
                                                        <img class="img-fluid img-thumbnail file-width lightbox"
                                                             src="{{ asset('templates/admin/images/icons/'.pathinfo($upload->filename,PATHINFO_EXTENSION).'.png')}}" alt="">
                                                    @else
                                                        <img class="img-fluid img-thumbnail file-width lightbox"
                                                             src="{{ asset('templates/admin/images/icons/file.png')}}" alt="">
                                                    @endif
                                                </a>
                                                <a href="javascript:void(0)"
                                                   onclick="deleteFile('{{ url('admin/booking/deletefile2') }}','{{$upload->id}}')"
                                                   class="bk-btn bk-btn-danger bk-btn-xs"
                                                   style="position:absolute; top:2px; left:2px;">
                                                    🗑
                                                </a>
                                            </div>
                                        @endforeach
                                    </div>
                                @endif

                                <div class="bk-form-group bk-mt-2">
                                    <textarea class="bk-textarea styler"
                                              placeholder="Driver Note"
                                              id="driver_note"
                                              name="driver_note"
                                              rows="3">{{$booking->driver_note}}</textarea>
                                </div>

                            </div>
                        </div>
                    </div>

                    {{-- ── POD Details ── --}}
                    <div class="col-lg-6 col-md-6 col-sm-12 mb-2">
                        <div class="bk-section">
                            <div class="bk-section-header header-green">
                                <span class="section-icon">✅</span>
                                POD Details
                            </div>
                            <div class="bk-section-body">

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">@lang('main.booking.field.pod_signature')</span>
                                        <input id="pod_signature" name="pod_signature"
                                               class="bk-input styler"
                                               type="text" maxlength="100"
                                               value="{{$booking->pod_signature}}"
                                               placeholder="@lang('main.booking.field.pod_signature')" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">Date</span>
                                        <input id="pod_date" name="pod_date"
                                               class="bk-input styler date1"
                                               type="text"
                                               value="@if($booking->pod_date){{\Carbon\Carbon::parse($booking->pod_date)->format('d-m-Y')}}@endif"
                                               placeholder="Date" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">@lang('main.booking.field.pod_time')</span>
                                        <input id="pod_time" name="pod_time"
                                               class="bk-input styler timepicker2"
                                               type="text" maxlength="20"
                                               value="{{$booking->pod_time}}"
                                               placeholder="@lang('main.booking.field.pod_time')" />
                                    </div>
                                </div>

                                <div class="bk-form-group">
                                    <div class="bk-input-group">
                                        <span class="bk-input-addon">🌡 Temp</span>
                                        <input id="delivered_temperature" name="delivered_temperature"
                                               class="bk-input styler"
                                               type="text" maxlength="20"
                                               value="{{$booking->delivered_temperature}}"
                                               placeholder="Delivered Temperature" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>{{-- /row --}}
            </div>{{-- /bk-card-body --}}

        </div>{{-- /bk-card --}}

        {{-- ── Via Address Accordion ── --}}
        <div class="accordion" id="accordionExample">
            <div class="row">
                @includeIf('admin.viaaddress.formEditPOD')
            </div>
        </div>

        {{-- ── Fixed Approve Button ── --}}
        <div class="bk-save-btn-wrapper">
            <button type="submit" class="bk-btn-save" name="btn-save" id="btnStatus">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Approve POD
            </button>
        </div>

    </div>{{-- /bk-page --}}

</form>

@else

<div class="bk-page">
    <div class="bk-card">
        <div class="bk-card-header header-teal">
            <h1 class="bk-card-title">
                Job Ref {{$customers->account_number}}-{{$booking->job_ref}} — POD Info
                @if(count($addresses) > 0)
                    <span class="bk-badge bk-badge-danger">{{count($addresses)}}</span>
                @endif
            </h1>
            <div class="bk-card-header-actions">
                <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="bk-btn bk-btn-danger bk-btn-sm">
                    ← @lang('app.goback')
                </a>
            </div>
        </div>
        <div class="bk-card-body bk-text-center" style="padding:2rem;">
            <p style="font-size:1rem; color:var(--danger); font-weight:600;">
                ✅ POD information has already been updated!
            </p>
        </div>
    </div>
</div>

@endif

@endsection
