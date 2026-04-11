<link rel="stylesheet" type="text/css" href="{{ asset('templates/admin/assets/css/reporting.css') }}"/>
<h4>@lang('app.posts.title')</h4>
<div class="vItems">
    <table class="table table-bordered" cellspacing="0">
        <tr>
            <td>@lang('app.posts.field.title')</td>
            <td>{{$post->title}}</td>
        </tr>
       <tr>
            <td>@lang('app.posts.field.content')</td>
            <td>{!!$post->content!!}</td>
        </tr>
       <tr>
            <td>@lang('app.posts.field.created')</td>
            <td>{{$post->created}}</td>
        </tr>
       <tr>
            <td>@lang('app.posts.field.modified')</td>
            <td>{{$post->modified}}</td>
        </tr>
       
    </table>
</div>

