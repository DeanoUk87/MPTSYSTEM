@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

        
<div class="row mb-2 htsDisplay">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header" style="">
                <nav class="nav  justify-content-between">
                    <a class="navbar-brand">@lang('app.posts.update')</a>
                    <a href="javascript:viod(0)" class="btn btn-info btn-sm" onclick="viewAll('{{route('posts.index')}}')"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                </nav>
            </div>
            <div class="card-body">
                <div class="hts-flash"></div>
                <form action="{{route('posts.update',['id'=>$post->id])}}" method="post" id="hezecomform" name="hezecomform" class="form-horizontal" enctype="multipart/form-data">
                    {{ csrf_field() }}
                     <input type="hidden" name="id" value="{{$post->id}}">
	                <div class="form-group">
                        <label class="control-label" for="title">@lang('app.posts.field.title')</label>
	                     <input id="title" name="title" class="form-control styler" type="text" maxlength="100"  value="{{$post->title}}" />
	                </div>
                     
                     <div class="row">
                        <div class="col-sm-12">
                           <div class="card">
                              <div class="card-heading card-default">
                               @lang('app.posts.field.content')
                              </div>
                              <div class="card-block editor-fit">
                                <textarea class="editor1" name="content" >{{$post->content}}</textarea>
                              </div>
                           </div>
                        </div>
                     </div>


                    <div class="form-group">
                        <label class="control-label" for="picture">@lang('app.upload')</label>
                        <br><input id="picture" name="picture" type="file" class="btn btn-default"/>
                        @if($post->picture and file_exists(base_path('public/uploads/'.$post->picture)))
                            <div class="app-gallery">
                                <div class="row" data-id="row-{{$post->id}}">
                                    <div class="col-lg-2 col-md-3 col-xs-6">
                                        <a class="lightbox" href="{{ asset('public/uploads')}}/{{$post->picture}}">
                                            <img class="file-width" src="{{ asset('public/uploads')}}/{{$post->picture}}" alt="">
                                        </a>
                                        <a href="javascript:viod(0);" onclick="deleteFile('{{ url('admin/posts/deletefile') }}','{{$post->id}}')"  class="btn btn-danger btn-sm" style="position: absolute; top:2px; left:15px"><i class="fa fa-trash fa-lg"></i></a>
                                    </div>
                                </div>
                            </div>
                        @endif
                    </div>
                        
                    <div class="form-group">
                        <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-update" id="btnStatus">
                           @lang('app.update.btn')
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

@endsection
        
