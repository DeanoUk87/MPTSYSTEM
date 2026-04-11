@extends('layouts.app')
@section('title')
    @lang('app.header_title') | @lang('app.roles.title')
@endsection
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="content-loader">
        <div class="row mb-2 htsDisplay">
            <div class="col-lg-12">
                <div class="card">
                    <div class="card-header">
                        <nav class="nav  justify-content-between">
                            <a class="navbar-brand">@lang('app.roles.title')</a>
                            <div class="btn-group">
                                <div class="dropdown">
                                    <button class="btn btn-info btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fa fa-cog"></i> @lang('app.options')
                                    </button>
                                    <div class="dropdown-menu" aria-labelledby="dropdownOptions" style="position: absolute; margin-left: -35px; top:40px; left: -10px; ">
                                        <a class="dropdown-item" href="#" onclick="insertForm('{{route('roles.create')}}')">@lang('app.roles.create')</a>
                                        <a class="dropdown-item" href="{{ route('users.index') }}">@lang('app.users.title')</a>
                                        <a class="dropdown-item" href="{{ route('permissions.index') }}">@lang('app.permissions.title')</a>
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </div>
                    <div class="card-body" style="padding: 10px 0 10px 0">
                        <table id="roles_datatable"  class="table table-hover dt-responsive nowrap" cellspacing="0" style="width:100%">
                            <thead>
                            <tr class="text-primary">
                                <th>@lang('app.roles.field.name')</th>
                                <th>@lang('app.permissions.field.name')</th>
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
    var table = $('#roles_datatable').DataTable({
        processing: true,
        serverSide: true,
        ajax: "{{ route('roles.getdata') }}",
        columns: [
            {data: 'name', name: 'name'},
            {data: 'permissions', name: 'permissions', orderable: false, searchable: false},
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


