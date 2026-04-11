<link rel="stylesheet" type="text/css" href="{{ asset('templates/admin/assets/css/reporting.css') }}"/>
<h4>@lang('app.posts.title')</h4>
<div class="vItems">
    <table class="table" cellspacing="0">
        <thead>
        <tr>
            <th>@lang('app.posts.field.title')</th>
            <th>@lang('app.posts.field.content')</th>
            <th>@lang('app.posts.field.created')</th>
            <th>@lang('app.posts.field.modified')</th>

        </tr>
        </thead>
        <tbody>
        @foreach($posts as $row)
            <tr>
                <td>{{$row->title}}</td>
                <td>{!! $row->content !!}</td>
                <td>{{$row->created}}</td>
                <td>{{$row->modified}}</td>
            </tr>
        @endforeach
        </tbody>
    </table>
</div>
