<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="Laravel Application">
    <meta name="author" content="Hezecom">
    <meta name="url" content="https://www.hezecom.com">
    <title><?php echo $__env->yieldContent('title'); ?></title>
    <link rel="stylesheet" type="text/css" href="<?php echo e(asset('vendor/bootstrap4/css/bootstrap.min.css')); ?>"/>
    <link rel="stylesheet" type="text/css" href="<?php echo e(asset('vendor/fontawesome4/css/font-awesome.min.css')); ?>"/>
    <link rel="stylesheet" type="text/css" href="<?php echo e(asset('templates/admin/assets/css/auth.css')); ?>"/>
    <link rel="shortcut icon" href="<?php echo e(asset('templates/admin/images/favicon.png')); ?>" />
</head>
<body>
<?php echo $__env->yieldContent('content'); ?>
<script type="text/javascript" src="<?php echo e(asset('vendor/jquery/jquery-3.2.1.min.js')); ?>"></script>
<script type="text/javascript" src="<?php echo e(asset('vendor/popper/popper.min.js')); ?>"></script>
<script type="text/javascript" src="<?php echo e(asset('vendor/bootstrap4/js/bootstrap.min.js')); ?>"></script>
<?php echo $__env->yieldContent('scripts'); ?>
</body>
</html>
<?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/layouts/auth.blade.php ENDPATH**/ ?>