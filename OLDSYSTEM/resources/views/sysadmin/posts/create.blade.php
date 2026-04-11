@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

        
<div class="row mb-2 htsDisplay">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header" style="">
                <nav class="nav  justify-content-between">
                    <a class="navbar-brand">@lang('app.posts.create')</a>
                    <a href="javascript:viod(0)" class="btn btn-info btn-sm" onclick="viewAll('{{route('posts.index')}}')"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                </nav>
            </div>
            <div class="card-body">
                <div class="hts-flash"></div>
                <form action="{{route('posts.store')}}" method="post" id="hezecomform" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
                    {{ csrf_field() }}
                        
	                <div class="form-group">
                        <label class="control-label" for="title">@lang('app.posts.field.title')</label>
	                     <input id="title" name="title" class="form-control styler" type="text" maxlength="100"  value="" />
	                </div>
                     
                     <div class="row">
                        <div class="col-sm-12">
                           <div class="card">
                              <div class="card-heading card-default">
                               @lang('app.posts.field.content')
                              </div>
                              <div class="card-block editor-fit">
                                <textarea class="editor1" name="content" ></textarea>
                              </div>
                           </div>
                        </div>
                     </div>
	                {{--<div class="form-group">
                        <label class="control-label" for="created">@lang('app.posts.field.created')</label>
	                     <input id="created" name="created" type="text" class="datepicker form-control styler" value="" />
	                </div>--}}

                    <div class="form-group">
                        <label class="control-label" for="fileupload">@lang('app.upload')</label>
                        <p><input type="file" id="picture" value="" name="picture" class="styler btn btn-default"/></p>
                    </div>
                     
                    <div class="form-group">
                        <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-save" id="btnStatus">
                           @lang('app.add.btn')
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection
        
