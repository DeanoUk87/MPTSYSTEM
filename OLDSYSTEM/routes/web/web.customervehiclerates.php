<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Customervehiclerates
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your customervehiclerates . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/customervehiclerates')->group(function () {
    Route::get('', 'Admin\CustomervehicleratesController@index')->name('customervehiclerates.index');
    Route::get('getdata', 'Admin\CustomervehicleratesController@getdata')->name('customervehiclerates.getdata');
    Route::get('details/{id}', 'Admin\CustomervehicleratesController@details')->name('customervehiclerates.details');
    Route::get('create', 'Admin\CustomervehicleratesController@insert')->name('customervehiclerates.create');
    Route::post('store', 'Admin\CustomervehicleratesController@store')->name('customervehiclerates.store');
    Route::get('edit/{id}', 'Admin\CustomervehicleratesController@edit')->name('customervehiclerates.edit');
    Route::post('update/{id}', 'Admin\CustomervehicleratesController@update')->name('customervehiclerates.update');
    Route::delete('delete/{id}', 'Admin\CustomervehicleratesController@destroy')->name('customervehiclerates.delete');
    Route::get('export/pdf', 'Admin\CustomervehicleratesController@exportPDF')->name('customervehiclerates.pdf');
    Route::get('export/pdf/{id}', 'Admin\CustomervehicleratesController@exportDetailPDF')->name('customervehiclerates.pdfdetails');
    Route::get('export/{type}', 'Admin\CustomervehicleratesController@exportFile')->name('customervehiclerates.export');
    Route::get('import/view', 'Admin\CustomervehicleratesController@importExportView')->name('customervehiclerates.import.view');
    Route::post('import/store', 'Admin\CustomervehicleratesController@importFile')->name('customervehiclerates.import.store');
    Route::delete('deletefile/{id}', 'Admin\CustomervehicleratesController@destroyFile')->name('customervehiclerates.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\CustomervehicleratesController@destroyFile2')->name('customervehiclerates.deletefile2');
    Route::post('delete/multi', 'Admin\CustomervehicleratesController@deletemulti')->name('customervehiclerates.deletemulti');

    Route::post('rates-auto', 'Admin\CustomervehicleratesController@ratesAuto')->name('rates.auto');
});
