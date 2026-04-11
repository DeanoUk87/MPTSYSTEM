@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

<div class="row mb-2 htsDisplay">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header" style="">
                <nav class="nav  justify-content-between">
                    <a class="navbar-brand">@lang('app.users.create')</a>
                    <a href="#" class="btn btn-info" onclick="viewAll('{{route('users.index')}}')"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                </nav>
            </div>
            <div class="card-body">
                <div class="hts-flash"></div>
                <form action="{{route('users.store')}}" method="post" id="hezecomform" class="form-horizontal">
                    {{ csrf_field() }}
                    <div class="form-group">
                        <input type="text" class="form-control p-input" id="name" name="name"  placeholder="Name">
                    </div>
                    <div class="form-group">
                        <input type="email" class="form-control p-input" id="email" name="email"  placeholder="Email">
                    </div>
                    <div class="form-group">
                        <input type="text" class="form-control p-input" id="username" name="username"  placeholder="Username">
                    </div>
                    <div class='form-group scrollarea'>
                        @foreach ($roles as $role)
                            <div class='row'>
                                <div class='col-md-1'>
                                    <input class="tgl tgl-ios" name="roles[]" id="{{$role->id}}" value="{{$role->id}}" type="checkbox"/>
                                    <label class="tgl-btn" for="{{$role->id}}"></label>
                                </div>
                                <div class='col-md-10' style="margin-left: 10px">
                                    <p style="font-size: 14px; color: #999;">{{ucfirst($role->name)}}</p>
                                </div>
                            </div>
                        @endforeach
                    </div>

                    <div class="form-group">
                        <input id="passwor-confirm" type="password" class="form-control" name="password" placeholder="@lang('app.users.fields.password')" required>
                    </div>
                    <div class="form-group">
                        <input id="password-confirm" type="password" class="form-control" name="password_confirmation" placeholder="@lang('app.users.fields.password2')" required>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btnStatus">
                            <span class="fa fa-hdd"></span> @lang('app.add.btn')
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection