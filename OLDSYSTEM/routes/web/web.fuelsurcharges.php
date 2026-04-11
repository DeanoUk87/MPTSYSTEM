<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Fuelsurcharges
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your fuelsurcharges . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/fuelsurcharges')->group(function () {
    Route::get('', 'Admin\FuelsurchargesController@index')->name('fuelsurcharges.index');
    Route::get('getdata', 'Admin\FuelsurchargesController@getdata')->name('fuelsurcharges.getdata');
    Route::get('details/{id}', 'Admin\FuelsurchargesController@details')->name('fuelsurcharges.details');
    Route::get('create', 'Admin\FuelsurchargesController@insert')->name('fuelsurcharges.create');
    Route::post('store', 'Admin\FuelsurchargesController@store')->name('fuelsurcharges.store');
    Route::get('edit/{id}', 'Admin\FuelsurchargesController@edit')->name('fuelsurcharges.edit');
    Route::post('update/{id}', 'Admin\FuelsurchargesController@update')->name('fuelsurcharges.update');
    Route::delete('delete/{id}', 'Admin\FuelsurchargesController@destroy')->name('fuelsurcharges.delete');
    Route::get('export/pdf', 'Admin\FuelsurchargesController@exportPDF')->name('fuelsurcharges.pdf');
    Route::get('export/pdf/{id}', 'Admin\FuelsurchargesController@exportDetailPDF')->name('fuelsurcharges.pdfdetails');
    Route::get('export/{type}', 'Admin\FuelsurchargesController@exportFile')->name('fuelsurcharges.export');
    Route::get('import/view', 'Admin\FuelsurchargesController@importExportView')->name('fuelsurcharges.import.view');
    Route::post('import/store', 'Admin\FuelsurchargesController@importFile')->name('fuelsurcharges.import.store');
    Route::delete('deletefile/{id}', 'Admin\FuelsurchargesController@destroyFile')->name('fuelsurcharges.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\FuelsurchargesController@destroyFile2')->name('fuelsurcharges.deletefile2');
    Route::post('delete/multi', 'Admin\FuelsurchargesController@deletemulti')->name('fuelsurcharges.deletemulti');
});
