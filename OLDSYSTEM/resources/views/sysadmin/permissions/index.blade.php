@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.permissions.title')
@endsection
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    @if (session('status'))
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    @endif

    <div class="content-loader">
        <div class="row mb-2 htsDisplay">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <nav class="nav  justify-content-between">
                            <a class="navbar-brand">@lang('app.permissions.title')</a>
                            {{--<a href="{{ route('permissions.generate') }}" class="btn btn-primary ">@lang('app.permissions.generate')</a>--}}
                            <div class="btn-group">
                                <div class="dropdown">
                                    <button class="btn btn-info btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fa fa-cog"></i> @lang('app.options')
                                    </button>
                                    <div class="dropdown-menu" aria-labelledby="dropdownOptions" style="position: absolute; margin-left: -35px; top:40px; left: -10px; ">
                                        <a class="dropdown-item" href="#" onclick="insertForm('{{route('permissions.create')}}')">@lang('app.permissions.create')</a>
                                        <a class="dropdown-item" href="{{ route('users.index') }}">@lang('app.users.title')</a>
                                        <a class="dropdown-item" href="{{ route('roles.index') }}">@lang('app.roles.title')</a>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </div>
                    <div class="card-body" style="padding: 10px 0 10px 0">
                        <table id="permissions_datatable"  class="table table-hover dt-responsive nowrap" cellspacing="0" style="width:100%">
                            <thead>
                            <tr class="text-primary">
                                <th>@lang('app.permissions.field.name')</th>
                                <th>@lang('app.permissions.field.route')</th>
                                <th>@lang('app.actions')</th>
                            </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts');
<script type="text/javascript">
    var table = $('#permissions_datatable').DataTable({
        processing: true,
        serverSide: true,
        ajax: "{{ route('permissions.getdata') }}",
        columns: [
            {data: 'name', name: 'name'},
            {data: 'route', name: 'route'},
            {data: 'action', name: 'action', orderable: false, searchable: false}
        ],
        "oLanguage": {
            "sStripClasses": "",
            "sSearch": '',
            "sSearchPlaceholder": "search here"
        }
    });
</script>
@include('partials.customjs');
@endsection
