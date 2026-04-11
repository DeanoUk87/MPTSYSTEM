@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.roles.edit')</a>
                        <a href="#" class="btn btn-info btn-sm" onclick="viewAll('{{route('roles.index')}}')"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                    </nav>
                </div>

                <div class="card-body">

                    <div class="hts-flash"></div>
                    <form class="form-horizontal" id="hezecomform" method="post" action="{{ route('roles.update', $role->id) }}" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <input type="hidden" id="id" name="id" value="{{ $role->id }}">

                        <div class="form-group">
                            <label for="name" class="control-label">Role Name</label>
                            <input type="text" class="form-control p-input" id="name" name="name" value="{{ $role->name }}" {{$input}}>
                        </div>

                        <p>@lang('app.roles.assign')</p>

                        <div class='form-group scrollarea'>
                            @foreach ($permissions as $permission)
                                <div class='row'>
                                    <div class='col-md-1'>
                                        @if(count($roles) and in_array($permission->id,$roles))
                                            <input class="tgl tgl-ios" name="permissions[]" value="{{$permission->id}}" type="checkbox" id="{{$permission->id}}" checked>
                                        @else
                                            <input class="tgl tgl-ios" name="permissions[]" value="{{$permission->id}}" type="checkbox" id="{{$permission->id}}">
                                        @endif
                                        <label class="tgl-btn" for="{{$permission->id}}"></label>
                                    </div>
                                    <div class='col-md-10' style="margin-left: 25px">
                                        <p style="font-size: 14px; color: #999;">{{ucfirst($permission->name)}}</p>
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btnStatus">
                                <span class="fa fa-hdd"></span> @lang('app.update.btn')
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>
@endsection
