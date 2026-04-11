@extends('layouts.app')

@section('title', 'Job Locked')

@section('content')
<div class="container" style="max-width:520px; margin-top:80px; text-align:center;">
    <div class="card">
        <div class="card-header bg-warning text-dark">
            <strong>&#128274; Job Currently In Use</strong>
        </div>
        <div class="card-body">
            <p style="font-size:1rem; margin-bottom:1rem;">
                <strong>{{ $lockedBy }}</strong> is currently editing Job <strong>{{ $jobRef }}</strong>.
            </p>
            <p class="text-muted" style="font-size:.875rem;">
                The job will become available automatically once they leave the page.
                This page will check again in <span id="countdown">30</span> seconds.
            </p>
            <div id="lockAccessMsg" class="alert alert-info" style="display:none; padding:8px 10px; font-size:12px;"></div>
            <a href="{{ route('booking.edit', ['id' => $jobRef]) }}" class="btn btn-primary" id="retryBtn">
                Try Again Now
            </a>
            <button type="button" class="btn btn-info" id="requestAccessBtn">Request Access</button>
            <button type="button" class="btn btn-danger" id="forceAccessBtn">Force Access</button>
            <a href="{{ route('booking.index', ['user' => 0, 'date1' => \Carbon\Carbon::now()->format('Y-m-d'), 'date2' => \Carbon\Carbon::now()->format('Y-m-d')]) }}" class="btn btn-secondary">
                Back to Jobs
            </a>
        </div>
    </div>
</div>
<script>
    var requestUrl = '{{ route('booking.locked.request', ['id' => $jobRef]) }}';
    var forceUrl   = '{{ route('booking.locked.force', ['id' => $jobRef]) }}';
    var statusUrl  = '{{ route('booking.locked.status', ['id' => $jobRef]) }}';
    var csrfToken  = '{{ csrf_token() }}';

    var seconds = 30;
    var countdown = document.getElementById('countdown');
    var msg = document.getElementById('lockAccessMsg');

    function showMsg(text, tone) {
        if (!msg) return;
        msg.style.display = 'block';
        msg.className = 'alert ' + (tone || 'alert-info');
        msg.style.padding = '8px 10px';
        msg.style.fontSize = '12px';
        msg.textContent = text;
    }

    function postJson(url, data, onDone) {
        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data || {})
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            if (res && res.redirect) {
                window.location.href = res.redirect;
                return;
            }
            if (onDone) onDone(res || {});
        });
    }

    document.getElementById('requestAccessBtn').addEventListener('click', function () {
        postJson(requestUrl, {}, function (res) {
            showMsg(res.message || 'Access request sent. Waiting for editor response.', 'alert-info');
        });
    });

    document.getElementById('forceAccessBtn').addEventListener('click', function () {
        if (!confirm('Force access will remove the current editor from this job. Continue?')) {
            return;
        }
        postJson(forceUrl, {}, function () {
            showMsg('Force access granted. Loading job...', 'alert-success');
        });
    });

    function pollStatus() {
        fetch(statusUrl, {
            headers: { 'X-CSRF-TOKEN': csrfToken, 'Content-Type': 'application/json' }
        })
        .then(function (res) { return res.json(); })
        .then(function (res) {
            if (!res || !res.ok) {
                return;
            }
            if (res.redirect) {
                window.location.href = res.redirect;
                return;
            }
            if (res.denied) {
                showMsg(res.message || 'Access request denied by the current editor.', 'alert-danger');
            }
        });
    }

    var timer = setInterval(function () {
        seconds--;
        if (countdown) countdown.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(timer);
            window.location.href = '{{ route('booking.edit', ['id' => $jobRef]) }}';
        }
    }, 1000);

    setInterval(pollStatus, 5000);
    pollStatus();
</script>
@endsection
