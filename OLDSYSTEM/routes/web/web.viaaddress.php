<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Viaaddress
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your viaaddress . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/viaaddress')->group(function () {
    Route::get('', 'Admin\ViaaddressController@index')->name('viaaddress.index');
    Route::get('getdata', 'Admin\ViaaddressController@getdata')->name('viaaddress.getdata');
    Route::get('details/{id}', 'Admin\ViaaddressController@details')->name('viaaddress.details');
    Route::get('create', 'Admin\ViaaddressController@insert')->name('viaaddress.create');
    Route::post('store', 'Admin\ViaaddressController@store')->name('viaaddress.store');
    Route::get('edit/{id}', 'Admin\ViaaddressController@edit')->name('viaaddress.edit');
    Route::post('update/{id}', 'Admin\ViaaddressController@update')->name('viaaddress.update');
    Route::delete('delete/{id}', 'Admin\ViaaddressController@destroy')->name('viaaddress.delete');
    Route::get('delete2/{id}', 'Admin\ViaaddressController@destroy2')->name('viaaddress.delete2');
    Route::get('export/pdf', 'Admin\ViaaddressController@exportPDF')->name('viaaddress.pdf');
    Route::get('export/pdf/{id}', 'Admin\ViaaddressController@exportDetailPDF')->name('viaaddress.pdfdetails');
    Route::get('export/{type}', 'Admin\ViaaddressController@exportFile')->name('viaaddress.export');
    Route::get('import/view', 'Admin\ViaaddressController@importExportView')->name('viaaddress.import.view');
    Route::post('import/store', 'Admin\ViaaddressController@importFile')->name('viaaddress.import.store');
    Route::delete('deletefile/{id}', 'Admin\ViaaddressController@destroyFile')->name('viaaddress.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\ViaaddressController@destroyFile2')->name('viaaddress.deletefile2');
    Route::post('delete/multi', 'Admin\ViaaddressController@deletemulti')->name('viaaddress.deletemulti');

    Route::post('address-auto', 'Admin\ViaaddressController@addressAuto')->name('viaaddress.address');
    Route::get('address-name', 'Admin\ViaaddressController@addressName')->name('viaaddress.name');
});
