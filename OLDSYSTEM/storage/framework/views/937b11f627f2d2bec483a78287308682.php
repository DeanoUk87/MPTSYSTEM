<!DOCTYPE html>
<html lang="<?php echo e(app()->getLocale()); ?>">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo $__env->yieldContent('title'); ?></title>
    <link rel="shortcut icon" type="image/png" sizes="16x16" href="<?php echo e(asset('templates/admin/images/favicon.png')); ?>" />
   <?php echo $__env->make('partials.appcss', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</head>
<body <?php if(strpos(request()->route()->getName(),'booking')!==false || strpos(request()->route()->getName(),'markers')!==false): ?> class="nav-collapsed" <?php endif; ?> >

<!-- ======= Top Navigation ======= -->
<?php echo $__env->make('partials.nav-top', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
<!-- ====== Right Navigation ======== -->
<?php echo $__env->make('partials.nav-right', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
<!-- ======== Left Navigation ======== -->
<?php echo $__env->make('partials.nav-left', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
<!-- ====== Content ===== -->
<section class="main-container container-fluid" >
    <?php echo $__env->yieldContent('content'); ?>
</section>

<footer class="footer">
    <span>Copyright &copy; <?php echo e(\Carbon\Carbon::now()->format('Y')); ?> <a href="#">MP Transport Ltd</a></span>
</footer>
<?php echo $__env->make('partials.appjs', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
<?php echo $__env->yieldContent('scripts'); ?>

<?php if (\Illuminate\Support\Facades\Blade::check('role', 'admin|developer')): ?>
<style>
#unitAlertToast {
    display: none;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    min-width: 300px;
    max-width: 420px;
    background: #ff6f00;
    color: #fff;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0,0,0,.35);
    padding: 12px 16px 10px;
    font-size: 13px;
    line-height: 1.45;
}
#unitAlertToast .toast-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 6px;
}
#unitAlertToast .toast-close {
    background: none;
    border: none;
    color: #fff;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0 0 0 10px;
}
#unitAlertToast .toast-body p {
    margin: 2px 0;
}
</style>
<div id="unitAlertToast">
    <div class="toast-header">
        <span>&#9888; Unit Temperature Alert</span>
        <button class="toast-close" onclick="document.getElementById('unitAlertToast').style.display='none'">&times;</button>
    </div>
    <div class="toast-body" id="unitAlertBody"></div>
</div>
<script>
(function () {
    var POLL_INTERVAL = 120000; // 2 minutes

    function checkAlerts() {
        $.getJSON('/api/storage?_=' + Date.now(), function (res) {
            if (res && res.messageCount > 0) {
                var html = '';
                res.messages.forEach(function (msg) {
                    html += '<p>' + $('<div>').text(msg).html() + '</p>';
                });
                document.getElementById('unitAlertBody').innerHTML = html;
                document.getElementById('unitAlertToast').style.display = 'block';
                try {
                    var audio = new Audio('<?php echo e(asset('audio/notification.mp3')); ?>');
                    audio.play().catch(function(){});
                } catch(e) {}
            }
        });
    }

    $(document).ready(function () {
        checkAlerts();
        setInterval(checkAlerts, POLL_INTERVAL);
    });
})();
</script>
<?php endif; ?>
</body>
</html>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/layouts/app.blade.php ENDPATH**/ ?>