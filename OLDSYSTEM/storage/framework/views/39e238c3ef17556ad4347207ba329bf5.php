<?php $__env->startSection('title'); ?>
    <?php echo app('translator')->get('app.header_title'); ?> | <?php echo app('translator')->get('app.users.sign_in'); ?>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>

<link rel="stylesheet" href="<?php echo e(asset('css/auth.css')); ?>">

    <div class="container-scroller">
        <div class="container-fluid">
            <div class="row">
                <div class="content-wrapper full-page-wrapper d-flex align-items-center auth-pages">
                    <div class="card col-lg-4 mx-auto">
                        <div class="card-body">
                            <p style="text-align: center"><img src="<?php echo e(asset('templates/admin/images/mp-logo-new.png')); ?>" width="145" height="54" alt=""/></p>
                            <h3 class="card-title text-left mb-3"><?php echo app('translator')->get('app.users.sign_in'); ?></h3>
                            <form class="form-horizontal" method="POST" action="<?php echo e(route('login')); ?>">
                                <?php echo e(csrf_field()); ?>


                                <div class="form-group<?php echo e($errors->has('email') ? ' has-error' : ''); ?>">
                                    <input id="email" type="text" class="form-control p_input" name="email" value="<?php echo e(old('email')); ?>" placeholder="Username or Email" required autofocus>
                                    <?php if($errors->has('email')): ?>
                                        <span class="help-block">
                                            <strong><?php echo e($errors->first('email')); ?></strong>
                                        </span>
                                    <?php endif; ?>
                                </div>

                                <div class="form-group<?php echo e($errors->has('password') ? ' has-error' : ''); ?>">
                                    <input id="password" type="password" class="form-control p_input" name="password" placeholder="<?php echo app('translator')->get('app.users.fields.password'); ?>" required>
                                    <?php if($errors->has('password')): ?>
                                        <span class="help-block">
                                            <strong><?php echo e($errors->first('password')); ?></strong>
                                        </span>
                                    <?php endif; ?>
                                </div>

                                <div class="form-group d-flex align-items-center justify-content-between">
                                    <div class="form-check">
                                        <label>
                                            <input type="checkbox" name="remember" <?php echo e(old('remember') ? 'checked' : ''); ?>> <?php echo app('translator')->get('app.users.fields.remember_me'); ?>
                                        </label>
                                    </div>
                                    <a href="<?php echo e(route('password.request')); ?>" class="forgot-pass"><?php echo app('translator')->get('app.users.forgot'); ?></a>
                                </div>

                                <div class="form-group">
                                    <label for="password" class="control-label sr-only">Enter Verification Code</label>
                                    <div class="captcha">
                                        <span><?php echo captcha_img(); ?></span>
                                        <button type="button" class="btn btn-refresh"><i class="fa fa-refresh"></i></button>
                                    </div>
                                </div>

                                <div class="form-group<?php echo e($errors->has('captcha') ? ' has-error' : ''); ?> mb-4">
                                    <input id="captcha" type="text" class="form-control" placeholder="Enter Captcha Answer" name="captcha">
                                    <?php if($errors->has('captcha')): ?>
                                        <span class="help-block">
                                            <strong><?php echo e($errors->first('captcha')); ?></strong>
                                            </span>
                                    <?php endif; ?>
                                </div>

                                <div class="text-center">
                                    <button type="submit" class="btn btn-danger p-3 btn-lg btn-block"><?php echo app('translator')->get('app.users.sign_in'); ?></button>
                                </div>

                                
                                
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
<?php $__env->stopSection(); ?>
<?php $__env->startSection('scripts'); ?>
    <script type="text/javascript">
      $(".btn-refresh").click(function(){
        $.ajax({
          type:'GET',
          url:'<?php echo e(route('refresh.captcha')); ?>',
          success:function(data){
            $(".captcha span").html(data.captcha);
          }
        });
      });
    </script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.auth', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /home/mptportco/public_html/portal.mp-transport.co.uk/resources/views/auth/login.blade.php ENDPATH**/ ?>