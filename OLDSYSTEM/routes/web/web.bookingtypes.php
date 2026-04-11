<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Bookingtypes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your bookingtypes . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/bookingtypes')->group(function () {
    Route::get('', 'Admin\BookingtypesController@index')->name('bookingtypes.index');
    Route::get('getdata', 'Admin\BookingtypesController@getdata')->name('bookingtypes.getdata');
    Route::get('details/{id}', 'Admin\BookingtypesController@details')->name('bookingtypes.details');
    Route::get('create', 'Admin\BookingtypesController@insert')->name('bookingtypes.create');
    Route::post('store', 'Admin\BookingtypesController@store')->name('bookingtypes.store');
    Route::get('edit/{id}', 'Admin\BookingtypesController@edit')->name('bookingtypes.edit');
    Route::post('update/{id}', 'Admin\BookingtypesController@update')->name('bookingtypes.update');
    Route::delete('delete/{id}', 'Admin\BookingtypesController@destroy')->name('bookingtypes.delete');
    Route::get('export/pdf', 'Admin\BookingtypesController@exportPDF')->name('bookingtypes.pdf');
    Route::get('export/pdf/{id}', 'Admin\BookingtypesController@exportDetailPDF')->name('bookingtypes.pdfdetails');
    Route::get('export/{type}', 'Admin\BookingtypesController@exportFile')->name('bookingtypes.export');
    Route::get('import/view', 'Admin\BookingtypesController@importExportView')->name('bookingtypes.import.view');
    Route::post('import/store', 'Admin\BookingtypesController@importFile')->name('bookingtypes.import.store');
    Route::delete('deletefile/{id}', 'Admin\BookingtypesController@destroyFile')->name('bookingtypes.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\BookingtypesController@destroyFile2')->name('bookingtypes.deletefile2');
    Route::post('delete/multi', 'Admin\BookingtypesController@deletemulti')->name('bookingtypes.deletemulti');
});
