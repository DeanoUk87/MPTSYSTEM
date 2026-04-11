@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.edit') {{$permission->name}}</a>
                        <a href="#" class="btn btn-info" onclick="viewAll('{{route('permissions.index')}}')"><i class="fa fa-undo-alt"></i> @lang('app.goback')</a>
                    </nav>
                </div>

                <div class="card-body">

                    <div class="hts-flash"></div>
                    <form action="{{route('permissions.update', $permission->id)}}" method="post" id="hezecomform" class="form-horizontal">
                        {{ csrf_field() }}

                        <input type="hidden" id="id" name="id" value="{{ $permission->id }}">

                        <div class="form-group">
                            <label for="name" class="control-label">Permission Name</label>
                            <input type="text" class="form-control p-input" value="{{ $permission->name }}" id="name" name="name" placeholder="e.g posts_create">
                        </div>
                        <div class="form-group">
                            <label for="route" class="control-label">Route - (the route you want to protect)</label>
                            <input type="text" class="form-control p-input" id="route" {{ $permission->route }} name="route" placeholder="e.g admin/posts/create">
                        </div>
                        <br>
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