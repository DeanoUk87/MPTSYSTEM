@extends('layouts.app')
@section('title')
    @lang('app.users.update_profile')
@endsection
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.users.update_profile')</a>
                    </nav>
                </div>
                <div class="card-body">
                    <form class="form-horizontal" id="hezecomform" method="post" action="{{ route('profile.updatepro') }}" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <input type="hidden" id="id" name="id" value="{{ $user->id }}">
                        <div class="col-md-12">
                        <div class="row">
                            <div class="col-md-7">
                                <div class="hts-flash"></div>
                                <div class="form-group">
                                    <label for="email" class="control-label">Email</label>
                                    <input id="email" type="text" class="form-control p_input" name="email" value="{{ $user->email }}">
                                </div>
                                <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                                    <label for="name" class="control-label">@lang('app.users.fields.name')</label>
                                    <input id="name" type="text" class="form-control p_input" name="name" value="{{ $user->name }}" required autofocus>
                                    @if ($errors->has('name'))
                                        <span class="help-block">
                                        <span>{{ $errors->first('name') }}</span>
                                    </span>
                                    @endif
                                </div>
                                <div class="form-group">
                                    <label for="username" class="control-label">Username</label>
                                    <input id="username" type="text" class="form-control p_input" name="username" value="{{ $user->username }}" readonly>
                                </div>

                                <div class="form-group">
                                    <button type="submit" id="btnStatus" class="btn btn-primary btn-lg">@lang('app.users.update_profile')</button>
                                </div>
                            </div>

                            <div class="col-md-3">
                                <div class="col-md-10 col-md-offset-1">
                                    @if($user->avatar)
                                        <img src="{{ asset('uploads/avatars')}}/{{ $user->avatar }}" style="width:120px; float:left; border-radius:50%; margin-right:25px;">
                                    @else
                                        <img src="{{ asset('templates/admin/images/avatar.jpg')}}" style="width:120px; float:left; border-radius:50%; margin-right:25px;">
                                    @endif
                                    <label>@lang('app.users.fields.image') </label>
                                    <input type="file" name="avatar">
                                </div>
                            </div>
                        </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
