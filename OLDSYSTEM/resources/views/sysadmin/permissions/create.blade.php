@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.permissions.create')</a>
                        <a href="#" class="btn btn-info" onclick="viewAll('{{route('permissions.index')}}')"><i class="fa fa-undo-alt"></i> @lang('app.goback')</a>
                    </nav>
                </div>

                <div class="card-body">
                    <div class="hts-flash"></div>
                    <form action="{{route('permissions.store')}}" method="post" id="hezecomform" class="form-horizontal">
                        {{ csrf_field() }}
                        <div class="form-group">
                            <label for="name" class="control-label">Permission Name</label>
                            <input type="text" class="form-control p-input" id="name" name="name" placeholder="e.g posts_create">
                        </div>
                        <div class="form-group">
                            <label for="route" class="control-label">Route - (the route you want to protect)</label>
                            <input type="text" class="form-control p-input" id="route" name="route" placeholder="e.g admin/posts/create">
                        </div>
                        <br>
                        @if(!$roles->isEmpty())
                            <p>@lang('app.permissions.assign')</p>
                            <div class='form-group scrollarea'>
                                @foreach ($roles as $role)
                                    <div class='row'>
                                        <div class='col-md-1'>
                                            <input class="tgl tgl-ios" name="roles[]" id="{{$role->id}}" value="{{$role->id}}" type="checkbox"/>
                                            <label class="tgl-btn" for="{{$role->id}}"></label>
                                        </div>
                                        <div class='col-md-10' style="margin-left: 25px">
                                            <p style="font-size: 14px; color: #999;">{{ucfirst($role->name)}}</p>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btnStatus">
                                <span class="fa fa-plus"></span> @lang('app.add.btn')
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection