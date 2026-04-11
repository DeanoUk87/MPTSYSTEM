@extends('layouts.app')

@section('title')
    @lang('app.users.password_password')
@endsection

@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-6">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.users.password_password')</a>
                        {{--<a href="#" class="btn btn-info" onclick="viewAll()"><i class="fa fa-undo-alt"></i> Go Back</a>--}}
                    </nav>
                </div>
                <div class="card-body">
                    <div class="hts-flash"></div>
                    <form class="form-horizontal" id="hezecomform" method="post" action="{{ route('profile.updatepasswordpro') }}" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <input type="hidden" id="id" name="id" value="{{ Auth::user()->id }}">
                        <div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
                            <label for="password" class="col-md-4 control-label">@lang('app.users.fields.password')</label>
                            <input id="password" type="password" class="form-control" name="password" required>
                            @if ($errors->has('password'))
                                <span class="help-block">
                                    <strong>{{ $errors->first('password') }}</strong>
                                </span>
                            @endif
                        </div>
                        <div class="form-group">
                            <label for="password-confirm" class="col-md-4 control-label">@lang('app.users.fields.password2')</label>
                            <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required>
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary btn-lg" id="btnStatus">@lang('app.change.btn')</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection