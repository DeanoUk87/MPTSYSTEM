<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Drivers
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your drivers . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/drivers')->group(function () {
    Route::get('', 'Admin\DriversController@index')->name('drivers.index');
    Route::get('getdata', 'Admin\DriversController@getdata')->name('drivers.getdata');
    Route::get('details/{id}', 'Admin\DriversController@details')->name('drivers.details');
    Route::get('create', 'Admin\DriversController@insert')->name('drivers.create');
    Route::post('store', 'Admin\DriversController@store')->name('drivers.store');
    Route::get('edit/{id}', 'Admin\DriversController@edit')->name('drivers.edit');
    Route::post('update/{id}', 'Admin\DriversController@update')->name('drivers.update');
    Route::delete('delete/{id}', 'Admin\DriversController@destroy')->name('drivers.delete');
    Route::get('export/pdf', 'Admin\DriversController@exportPDF')->name('drivers.pdf');
    Route::get('export/pdf/{id}', 'Admin\DriversController@exportDetailPDF')->name('drivers.pdfdetails');
    Route::get('export/{type}', 'Admin\DriversController@exportFile')->name('drivers.export');
    Route::get('import/view', 'Admin\DriversController@importExportView')->name('drivers.import.view');
    Route::post('import/store', 'Admin\DriversController@importFile')->name('drivers.import.store');
    Route::delete('deletefile/{id}', 'Admin\DriversController@destroyFile')->name('drivers.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\DriversController@destroyFile2')->name('drivers.deletefile2');
    Route::post('delete/multi', 'Admin\DriversController@deletemulti')->name('drivers.deletemulti');

    Route::post('driver-auto', 'Admin\DriversController@driversAuto')->name('driver.auto');

    // Access
    Route::get('signup/{id}', 'Admin\DriversController@SignUpAccess')->name('driver.signup');
    Route::post('store/signup', 'Admin\DriversController@SignUpAccessPro')->name('driver.signup.store');
});
