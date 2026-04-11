<?php

/*
|--------------------------------------------------------------------------
| Web Routes - Invoices
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your invoices . These
| routes are loaded by the RouteServiceProvider within a group which
| contains the web middleware group.
|
*/
Route::prefix('admin/invoices')->group(function () {
    Route::get('', 'Admin\InvoicesController@index')->name('invoices.index');
    Route::get('getdata', 'Admin\InvoicesController@getdata')->name('invoices.getdata');
    Route::get('getdata/{fromdate}/{todate}', 'Admin\InvoicesController@getdata')->name('invoices.search');
    Route::get('details/{id}', 'Admin\InvoicesController@details')->name('invoices.details');
    Route::get('create', 'Admin\InvoicesController@insert')->name('invoices.create');
    Route::post('store', 'Admin\InvoicesController@store')->name('invoices.store');
    Route::get('edit/{id}', 'Admin\InvoicesController@edit')->name('invoices.edit');
    Route::post('update/{id}', 'Admin\InvoicesController@update')->name('invoices.update');
    Route::delete('delete/{id}', 'Admin\InvoicesController@destroy')->name('invoices.delete');
    Route::get('export/pdf', 'Admin\InvoicesController@exportPDF')->name('invoices.pdf');
    Route::get('export/pdf/{id}', 'Admin\InvoicesController@exportDetailPDF')->name('invoices.pdfdetails');
    Route::get('export/{type}', 'Admin\InvoicesController@exportFile')->name('invoices.export');
    Route::get('import/view', 'Admin\InvoicesController@importExportView')->name('invoices.import.view');
    Route::post('import/store', 'Admin\InvoicesController@importFile')->name('invoices.import.store');
    Route::delete('deletefile/{id}', 'Admin\InvoicesController@destroyFile')->name('invoices.deletefile');
    Route::delete('deletefile2/{id}', 'Admin\InvoicesController@destroyFile2')->name('invoices.deletefile2');
    Route::post('delete/multi', 'Admin\InvoicesController@deletemulti')->name('invoices.deletemulti');

    Route::post('invoice-auto', 'Admin\InvoicesController@invoiceAuto')->name('invoices.auto');
    Route::post('generator', 'Admin\InvoicesController@details')->name('invoices.generator');
    Route::post('mail-invoice', 'Admin\InvoicesController@sendinvoiceToMail')->name('invoice.mail');
    Route::post('export-invoice', 'Admin\InvoicesController@ExportToCsvSage')->name('invoices.exporter');

    Route::get('customers', 'Admin\InvoicesController@customerView')->name('invoices.customers');
    Route::get('customers/{fromdate}/{todate}', 'Admin\InvoicesController@customerData')->name('invoices.customers.data');
    Route::get('customers/invoiced/{id}/{status}', 'Admin\InvoicesController@invoiceStatus')->name('invoices.customers.invoiced');
});
