<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Jobaccess
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your jobaccess . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/jobaccess')->group(function () {
    Route::get('', 'Admin\JobaccessController@index')->name('jobaccess.index');
    Route::get('getdata', 'Admin\JobaccessController@getdata')->name('jobaccess.getdata');
    Route::get('access/{id}/{type}', 'Admin\JobaccessController@access')->name('job.access');
    Route::get('edit/{id}', 'Admin\JobaccessController@edit')->name('jobaccess.edit');
    Route::get('edit/{id}', 'Admin\JobaccessController@edit')->name('jobaccess.edit');
    Route::post('update/{id}', 'Admin\JobaccessController@update')->name('jobaccess.update');
    Route::post('force/{id}', 'Admin\JobaccessController@forceAccess')->name('jobaccess.force');
    Route::post('delete/multi', 'Admin\JobaccessController@deletemulti')->name('jobaccess.deletemulti');
    Route::get('access/revoke/job/{id}', 'Admin\JobaccessController@revokeAccess')->name('jobaccess.revoke');
    Route::get('truncate', 'Admin\JobaccessController@truncate')->name('jobaccess.truncate');
});
