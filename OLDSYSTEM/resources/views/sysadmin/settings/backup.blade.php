@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.settings')
@endsection

@section('content')
    {{-- Success message --}}
    @if (session('status'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            {{ session('status') }}
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    @endif

    {{-- Error message --}}
    @if (session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ session('error') }}
            <button type="button" class="close" data-dismiss="alert">&times;</button>
        </div>
    @endif

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header">
                    <nav class="nav justify-content-between align-items-center">
                        <a class="navbar-brand mb-0">Backup List</a>
                        <a href="{{ route('backup.create') }}" class="btn btn-success">
                            <i class="fa fa-database"></i> Create Backup
                        </a>
                    </nav>
                </div>

                <div class="card-body">
                    @forelse($backups as $backup)
                        <div class="row mb-3 align-items-center">
                            <div class="col-md-6">
                                {{-- Show the full filename including extension --}}
                                <span class="btn btn-info btn-sm disabled">{{ $backup }}</span>

                                <a href="{{ route('backup.restore', ['name' => $backup]) }}"
                                   class="btn btn-primary btn-sm"
                                   onclick="return confirm('Restore \'{{ $backup }}\' ? This will overwrite the current database.');">
                                    <i class="fa fa-undo"></i> Restore
                                </a>

                                <a href="{{ route('backup.delete', ['name' => $backup]) }}"
                                   class="btn btn-danger btn-sm"
                                   onclick="return confirm('Permanently delete \'{{ $backup }}\' ?');">
                                    <i class="fa fa-trash"></i> Delete
                                </a>
                            </div>
                        </div>
                    @empty
                        <p class="text-muted">No backups found. Click <strong>Create Backup</strong> to get started.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
@endsection