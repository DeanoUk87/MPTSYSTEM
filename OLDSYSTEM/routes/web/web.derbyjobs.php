<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Derbyjobs
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your derbyjobs . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/derbyjobs')->group(function () {
    Route::get('', 'Admin\DerbyjobsController@index')->name('derbyjobs.index');
    Route::get('getdata', 'Admin\DerbyjobsController@getdata')->name('derbyjobs.getdata');
    Route::get('getdata/{fromdate}/{todate}/{customer}/{driver}', 'Admin\DerbyjobsController@getdata')->name('derbyjobs.search');
    Route::get('details/{id}', 'Admin\DerbyjobsController@details')->name('derbyjobs.details');
    Route::get('create', 'Admin\DerbyjobsController@insert')->name('derbyjobs.create');
    Route::post('store', 'Admin\DerbyjobsController@store')->name('derbyjobs.store');
    Route::get('edit/{id}', 'Admin\DerbyjobsController@edit')->name('derbyjobs.edit');
    Route::post('update/{id}', 'Admin\DerbyjobsController@update')->name('derbyjobs.update');
    Route::delete('delete/{id}', 'Admin\DerbyjobsController@destroy')->name('derbyjobs.delete');
    Route::get('export/pdf', 'Admin\DerbyjobsController@exportPDF')->name('derbyjobs.pdf');
    Route::get('export/pdf/{id}', 'Admin\DerbyjobsController@exportDetailPDF')->name('derbyjobs.pdfdetails');
    Route::get('export/{type}', 'Admin\DerbyjobsController@exportFile')->name('derbyjobs.export');
    Route::get('import/view', 'Admin\DerbyjobsController@importExportView')->name('derbyjobs.import.view');
    Route::post('import/store', 'Admin\DerbyjobsController@importFile')->name('derbyjobs.import.store');
    Route::delete('deletefile/{id}', 'Admin\DerbyjobsController@destroyFile')->name('derbyjobs.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\DerbyjobsController@destroyFile2')->name('derbyjobs.deletefile2');
    Route::post('delete/multi', 'Admin\DerbyjobsController@deletemulti')->name('derbyjobs.deletemulti');

    Route::post('oldaddress-auto', 'Admin\DerbyjobsController@addressAuto')->name('oldCustomers.address.auto');
    Route::post('olddrivers-auto', 'Admin\DerbyjobsController@driversAuto')->name('oldDriver.address.auto');
});
