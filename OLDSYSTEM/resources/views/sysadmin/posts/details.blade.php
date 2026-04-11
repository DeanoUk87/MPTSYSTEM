@extends('layouts.form')
@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

        
<div class="row mb-2 viewDetails">
    <div class="col-lg-12">
        <div class="card">
            <div class="card-header">
                <nav class="nav  justify-content-between">
                    <a class="navbar-brand">@lang('app.posts.details')</a>
                    <div class="btn-group">
                        <a href="javascript:viod(0)" class="btn btn-info btn-sm" onclick="viewAll('{{route('posts.index')}}')"><i class="fa fa-reply"></i> @lang('app.goback')</a>
                        <a href="{{route('posts.pdfdetails',['id'=>$post->id])}}" class="btn btn-success btn-sm" ><i class="fa fa-file-pdf"></i> @lang('app.pdf')</a>
                    </div>
                </nav>
            </div>
            <div class="card-body">
                <ul class="list-group">
                       
                    <li class="list-group-item">
                        <span>@lang('app.posts.field.title')</span>
                        <p>{{$post->title}}</p>
                    </li>
                    
                    <li class="list-group-item">
                        <span>@lang('app.posts.field.content')</span>
                        <p>{!!$post->content!!}</p>
                    </li>
                    
                    <li class="list-group-item">
                        <span>@lang('app.posts.field.created')</span>
                        <p>{{$post->created}}</p>
                    </li>
                    
                    <li class="list-group-item">
                        <span>@lang('app.posts.field.modified')</span>
                        <p>{{$post->modified}}</p>
                    </li>


                    @if($post->picture and file_exists(base_path('public/uploads/'.$post->picture)))
                        <div class="app-gallery">
                            <div class="row">
                                <div class="col-lg-2 col-md-3 col-xs-6">
                                    <a class="lightbox" href="{{ asset('public/uploads')}}/{{$post->picture}}">
                                        <img class="file-width" src="{{ asset('public/uploads')}}/{{$post->picture}}" alt="">
                                    </a>
                                </div>
                            </div>
                        </div>
                    @endif
                 
                </ul>
                
            </div>
        </div>
    </div>
</div>

@endsection
        
