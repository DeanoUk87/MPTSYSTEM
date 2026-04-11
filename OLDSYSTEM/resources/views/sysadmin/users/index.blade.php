@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.users.title')
@endsection


@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="content-loader">
        <form action="{{route('users.deletemulti')}}" method="post" id="hezecomform" class="form-horizontal">
            {{ csrf_field() }}
            <div class="row mb-2 htsDisplay">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="card-header">
                            <nav class="nav  justify-content-between">
                                <a class="navbar-brand">@lang('app.users.title')</a>
                                <div class="hts-flash"></div>
                                <div class="btn-group">
                                    <div class="dropdown">
                                        <button type="submit" class="btnDelete btn btn-danger btn-sm" name="btn-delete" id="btnStatus" style="display: none">
                                            <span class="fa fa-trash"></span> @lang('app.delete')
                                        </button>
                                        <button class="btn btn-info btn-sm dropdown-toggle" type="button" id="dropdownOptions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="fa fa-cog"></i> @lang('app.options')
                                        </button>
                                        <div class="dropdown-menu" aria-labelledby="dropdownOptions" style="position: absolute; margin-left: -35px; top:40px; left: -10px; ">
                                            <a class="dropdown-item" href="#" onclick="insertForm('{{route('users.create')}}')">@lang('app.users.create')</a>
                                            <a class="dropdown-item" href="{{ route('roles.index') }}">@lang('app.roles.title')</a>
                                            <a class="dropdown-item" href="{{ route('permissions.index') }}">@lang('app.permissions.title')</a>
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </div>
                        <div class="card-body" style="padding: 10px 0 10px 0">
                            <div class="vItems">
                                <table id="users_datatable"  class="table table-hover  table-responsive dt-responsive nowrap" cellspacing="0" style="width:100%">
                                    <thead>
                                    <tr class="text-primary">
                                        <td>
                                            <input type="checkbox" id="checkAll" class="check-style filled-in light-blue">
                                            <label for="checkAll" class="checklabel"></label>
                                        </td>
                                        <th>@lang('app.users.fields.name')</th>
                                        <th>@lang('app.users.fields.email')</th>
                                        <th>@lang('app.users.fields.roles')</th>
                                        <th>@lang('app.users.fields.created')</th>
                                        <th>@lang('app.users.fields.image')</th>
                                        <th>@lang('app.actions')</th>
                                    </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
@endsection

@section('scripts');
<script type="text/javascript">
    var table = $('#users_datatable').DataTable({
        processing: true,
        serverSide: true,
        ajax: "{{ route('users.getdata') }}",
        columns: [
            {data: 'id', name: 'id',orderable: false, searchable: false},
            {data: 'name', name: 'name'},
            {data: 'email', name: 'email'},
            {data: 'role_assigned', name: 'role_assigned'},
            {data: 'created_at', name: 'created_at'},
            {data: 'show_avatar', name: 'show_avatar', orderable: false, searchable: false},
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

