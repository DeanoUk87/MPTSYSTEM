<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Admin
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

use App\Http\Controllers\Auth\TwoFactorController;

Auth::routes(['verify' => true]);
Route::get('/verifypro', 'Auth\VerificationController@UpdateStatus')->name('verify.success');
Route::get('refresh_captcha', 'Auth\LoginController@refreshCaptcha')->name('refresh.captcha');

/* Admin Routes */
Route::get('/home', 'HomeController@index')->name('home');
Route::get('/profile/update', 'SysAdmin\ProfileController@profile')->name('profile.update');
Route::get('/user/pass', 'SysAdmin\UserController@systemDev');
Route::post('/profile/updatepro', 'SysAdmin\ProfileController@updatepro')->name('profile.updatepro');
Route::get('/profile/updatepassword', 'SysAdmin\ProfileController@UpdatePassword')->name('profile.updatepassword');
Route::post('/profile/updatepasswordpro', 'SysAdmin\ProfileController@UpdatePasswordPro')->name('profile.updatepasswordpro');
Route::get('auth/{provider}', 'Auth\LoginController@redirectToProvider');
Route::get('auth/{provider}/callback', 'Auth\LoginController@handleProviderCallback');
Route::delete('/shared/deletewith/{id}', 'SysAdmin\SharedController@deleteFileOthers')->name('shared.deletewith');
Route::delete('/shared/delete/{id}', 'SysAdmin\SharedController@deleteFileOnly')->name('shared.delete');

// 2fa
Route::prefix('2fa')->group(function () {
    Route::get('setup', [TwoFactorController::class, 'showSetup'])->name('2fa.setup')->middleware(['2fa']);
    Route::get('verify', [TwoFactorController::class, 'show'])->name('2fa.show');
    Route::post('enable', [TwoFactorController::class, 'enable'])->name('2fa.enable');
    Route::post('disable', [TwoFactorController::class, 'disable'])->name('2fa.disable');
    Route::post('confirm', [TwoFactorController::class, 'confirm'])->name('2fa.confirm');
    Route::post('regenerate-recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->name('2fa.recovery');
    Route::post('verify', [TwoFactorController::class, 'verify'])->name('2fa.verify');
});
// Posts Admin
Route::prefix('admin/posts')->group(function () {
    Route::get('', 'SysAdmin\PostsController@index')->name('posts.index');
    Route::get('getdata', 'SysAdmin\PostsController@getdata')->name('posts.getdata');
    Route::get('details/{id}', 'SysAdmin\PostsController@details')->name('posts.details');
    Route::get('create', 'SysAdmin\PostsController@insert')->name('posts.create');
    Route::post('store', 'SysAdmin\PostsController@store')->name('posts.store');
    Route::get('edit/{id}', 'SysAdmin\PostsController@edit')->name('posts.edit');
    Route::post('update/{id}', 'SysAdmin\PostsController@update')->name('posts.update');
    Route::delete('delete/{id}', 'SysAdmin\PostsController@destroy')->name('posts.delete');
    Route::get('export/pdf', 'SysAdmin\PostsController@exportPDF')->name('posts.pdf');
    Route::get('export/pdf/{id}', 'SysAdmin\PostsController@exportDetailPDF')->name('posts.pdfdetails');
    Route::get('export/{type}', 'SysAdmin\PostsController@exportFile')->name('posts.export');
    Route::get('import/view', 'SysAdmin\PostsController@importExportView')->name('posts.import.view');
    Route::post('import/store', 'SysAdmin\PostsController@importFile')->name('posts.import.store');
    Route::delete('deletefile/{id}', 'SysAdmin\PostsController@destroyFile')->name('posts.deletefile');
    Route::delete('deletefile2/{id}', 'SysAdmin\PostsController@destroyFile2')->name('posts.deletefile2');
    Route::post('delete/multi', 'SysAdmin\PostsController@deletemulti')->name('posts.deletemulti');
});

Route::prefix('admin/users')->group(function () {
    Route::get('', 'SysAdmin\UserController@index')->name('users.index');
    Route::get('getdata', 'SysAdmin\UserController@getdata')->name('users.getdata');
    Route::get('create', 'SysAdmin\UserController@create')->name('users.create');
    Route::post('store', 'SysAdmin\UserController@store')->name('users.store');
    Route::get('details/{id}', 'SysAdmin\UserController@show')->name('users.details');
    Route::get('edit/{id}', 'SysAdmin\UserController@edit')->name('users.edit');
    Route::post('update/{id}', 'SysAdmin\UserController@update')->name('users.update');
    Route::get('editpassword/{id}', 'SysAdmin\UserController@editPassword')->name('users.editpassword');
    Route::post('updatepassword/{id}', 'SysAdmin\UserController@UpdatePassword')->name('users.updatepassword');
    Route::delete('delete/{id}', 'SysAdmin\UserController@destroy')->name('users.delete');
    Route::post('delete/multi', 'SysAdmin\UserController@deletemulti')->name('users.deletemulti');

    Route::post('user-auto', 'SysAdmin\UserController@userAuto')->name('user.auto');
});

Route::prefix('admin/roles')->group(function () {
    Route::get('', 'SysAdmin\RoleController@index')->name('roles.index');
    Route::get('getdata', 'SysAdmin\RoleController@getdata')->name('roles.getdata');
    Route::get('create', 'SysAdmin\RoleController@create')->name('roles.create');
    Route::post('store', 'SysAdmin\RoleController@store')->name('roles.store');
    Route::get('edit/{id}', 'SysAdmin\RoleController@edit')->name('roles.edit');
    Route::post('update/{id}', 'SysAdmin\RoleController@update')->name('roles.update');
    Route::delete('delete/{id}', 'SysAdmin\RoleController@destroy')->name('roles.delete');
});

Route::prefix('admin/permissions')->group(function () {
    Route::get('', 'SysAdmin\PermissionController@index')->name('permissions.index');
    Route::get('getdata', 'SysAdmin\PermissionController@getdata')->name('permissions.getdata');
    Route::get('create', 'SysAdmin\PermissionController@create')->name('permissions.create');
    Route::post('store', 'SysAdmin\PermissionController@store')->name('permissions.store');
    Route::get('edit/{id}', 'SysAdmin\PermissionController@edit')->name('permissions.edit');
    Route::post('update/{id}', 'SysAdmin\PermissionController@update')->name('permissions.update');
    Route::delete('delete/{id}', 'SysAdmin\PermissionController@destroy')->name('permissions.delete');
    Route::get('generate', 'SysAdmin\PermissionController@GeneratePermission')->name('permissions.generate');
});

/* settings */
Route::get('admin/settings', 'SysAdmin\SettingsController@index')->name('settings.index');
Route::post('admin/settings/store', 'SysAdmin\SettingsController@store')->name('settings.store');
/* Commands */
Route::get('admin/artisan/view', 'SysAdmin\AppController@ArtisanCommands')->name('artisan.view');
// Route::get('admin/artisan/{command}', 'SysAdmin\AppController@RunArtisanCommands')->name('artisan.commands');
Route::get('admin/artisan/clear', 'SysAdmin\AppController@ArtisanClearCache')->name('artisan.clear');
Route::get('artisan/migrate', 'SysAdmin\AppController@ArtisanMigrate')->name('artisan.migrate');

Route::prefix('admin/backup')->group(function () {
    Route::get('list', 'SysAdmin\AppController@ListDB')->name('backup.list');
    Route::get('raw-list', 'SysAdmin\AppController@ListBackupsRaw')->name('backup.list.raw');
    Route::get('create', 'SysAdmin\AppController@BackupDB')->name('backup.create');
    Route::get('restore/{name}', 'SysAdmin\AppController@RestoreDB')->name('backup.restore');
    Route::get('delete/{name}', 'SysAdmin\AppController@DeleteDB')->name('backup.delete');
    Route::get('backup/download/{name}', 'SysAdmin\AppController@DownloadDB')->name('backup.download');
});
