@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Change Password
@endsection
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.users.reset_password')</a>
                        <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="btn btn-info"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                    </nav>
                </div>
                <div class="card-body">
                    <div class="hts-flash"></div>
                    <form class="form-horizontal" id="hezecomform" method="post" action="{{ route('users.updatepassword', $user->id) }}" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <input type="hidden" id="id" name="id" value="{{ $user->id }}">
                        <div class="form-group">
                            <input id="passwor-confirm" type="password" class="form-control" name="password" placeholder="@lang('app.users.fields.password')">
                        </div>
                        <div class="form-group">
                            <input id="password-confirm" type="password" class="form-control" name="password_confirmation" placeholder="@lang('app.users.fields.password2')">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btn-save">
                                <span class="fa fa-hdd"></span> Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
