<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Customers
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your customers . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/customers')->group(function () {
    Route::get('', 'Admin\CustomersController@index')->name('customers.index');
    Route::get('getdata', 'Admin\CustomersController@getdata')->name('customers.getdata');
    Route::get('details/{id}', 'Admin\CustomersController@details')->name('customers.details');
    Route::get('create', 'Admin\CustomersController@insert')->name('customers.create');
    Route::post('store', 'Admin\CustomersController@store')->name('customers.store');
    Route::get('edit/{id}', 'Admin\CustomersController@edit')->name('customers.edit');
    Route::post('update/{id}', 'Admin\CustomersController@update')->name('customers.update');
    Route::delete('delete/{id}', 'Admin\CustomersController@destroy')->name('customers.delete');
    Route::get('export/pdf', 'Admin\CustomersController@exportPDF')->name('customers.pdf');
    Route::get('export/pdf/{id}', 'Admin\CustomersController@exportDetailPDF')->name('customers.pdfdetails');
    Route::get('export/{type}', 'Admin\CustomersController@exportFile')->name('customers.export');
    Route::get('import/view', 'Admin\CustomersController@importExportView')->name('customers.import.view');
    Route::post('import/store', 'Admin\CustomersController@importFile')->name('customers.import.store');
    Route::delete('deletefile/{id}', 'Admin\CustomersController@destroyFile')->name('customers.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\CustomersController@destroyFile2')->name('customers.deletefile2');
    Route::post('delete/multi', 'Admin\CustomersController@deletemulti')->name('customers.deletemulti');

    Route::post('address-auto', 'Admin\CustomersController@addressAuto')->name('customers.address.auto');
    Route::get('address/{id}', 'Admin\CustomersController@addressById')->name('customers.address.byid');

    // Access
    Route::get('signup/{id}', 'Admin\CustomersController@SignUpAccess')->name('customer.signup');
    Route::post('store/signup', 'Admin\CustomersController@SignUpAccessPro')->name('customer.signup.store');
});
