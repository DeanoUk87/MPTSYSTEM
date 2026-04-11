@extends('layouts.app')

@section('title')
    @lang('app.header_title') | Edit @lang('app.users.title')
@endsection
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.users.update')</a>
                        <a href="{{route('users.editpassword',['id'=>$user->id])}}" class="btn btn-outline-success"><i class="fa fa-lock"></i> Change Password</a>
                        <a href="{{\Illuminate\Support\Facades\URL::previous()}}" class="btn btn-info"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                    </nav>
                </div>
                <div class="card-body">
                    <div class="hts-flash"></div>
                    <form class="form-horizontal" id="hezecomform" method="post" action="{{ route('users.update', $user->id) }}" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <input type="hidden" id="id" name="id" value="{{ $user->id }}">
                        <div class="form-group">
                            <label for="name" class="control-label">Name</label>
                            <input type="text" class="form-control p-input" id="name" name="name" value="{{ $user->name }}">
                        </div>
                        <div class="form-group">
                            <label for="username" class="control-label">Username</label>
                            <input type="text" class="form-control p-input" id="username" name="username" value="{{ $user->username }}">
                        </div>
                        <div class="form-group">
                            <label for="email" class="control-label">Email</label>
                            <input type="email" class="form-control p-input" id="email" name="email" value="{{ $user->email }}">
                        </div>

                        <h5 class="@if(request()->input('driver')) sr-only @endif'">@lang('app.roles.title')</h5>
                        <div class='form-group scrollarea @if(request()->input('driver')) sr-only @endif @if(request()->input('customer')) sr-only @endif'>
                            @foreach ($roles as $role)
                                <div class='row'>
                                    <div class='col-md-1'>
                                        @if(count($userRoles) and in_array($role->id,$userRoles))
                                            <input class="tgl tgl-ios" name="roles[]" value="{{$role->id}}" type="checkbox" id="{{$role->id}}" checked>
                                        @else
                                            <input class="tgl tgl-ios" name="roles[]" value="{{$role->id}}" type="checkbox" id="{{$role->id}}">
                                        @endif
                                        <label class="tgl-btn" for="{{$role->id}}"></label>
                                    </div>
                                    <div class='col-md-10' style="margin-left: 25px">
                                        <p style="font-size: 14px; color: #999;">{{ucfirst($role->name)}}</p>
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btnStatus">
                                <span class="fa fa-hdd"></span> Update
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>
@endsection
