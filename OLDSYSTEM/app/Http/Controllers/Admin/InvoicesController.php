<?php

namespace App\Http\Controllers\Admin;

use App\Exports\CustomExports;
use App\Exports\InvoicesExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\InvoicesImports;
use App\Mail\MailInvoice;
use App\Models\Booking;
use App\Models\Customers;
use App\Models\Invoices;
use App\Models\Usersettings;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class InvoicesController extends Controller
{
    use Uploader;


    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    public function index(Request $request)
    {
        if (isset($_GET['date1'])) {
            $fromDate = Carbon::parse($_GET['date1'], config('app.timezone'))->format('Y-m-d');
            $toDate = Carbon::parse($_GET['date2'], config('app.timezone'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }

        return view('admin.invoices.index', compact('fromDate', 'toDate'));
    }

    public function getdata($fromDate = null, $toDate = null)
    {
        if ($fromDate and $toDate) {
            if (Auth::user()->hasRole('admin')) {
                $invoices = Invoices::LeftJoin('users', 'users.id', '=', 'invoices.user_id')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'invoices.customer_id')
                    ->select('users.username', 'invoices.*', 'customers.customer', 'customers.account_number')
                    ->whereBetween(DB::raw('DATE(invoices.updated_at)'), [$fromDate, $toDate])
                    ->orderBy('invoice_number', 'desc');
            } else {
                $invoices = Invoices::LeftJoin('users', 'users.id', '=', 'invoices.user_id')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'invoices.customer_id')
                    ->select('users.username', 'invoices.*', 'customers.customer', 'customers.account_number')
                    ->where('invoices.user_id', $this->createdFor())
                    ->whereBetween(DB::raw('DATE(invoices.updated_at)'), [$fromDate, $toDate])
                    ->orderBy('invoice_number', 'desc');
            }
        } else {
            if (Auth::user()->hasRole('admin')) {
                $invoices = Invoices::LeftJoin('users', 'users.id', '=', 'invoices.user_id')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'invoices.customer_id')
                    ->select('users.username', 'invoices.*', 'customers.customer', 'customers.account_number')
                    ->orderBy('invoice_number', 'desc');
            } else {
                $invoices = Invoices::LeftJoin('users', 'users.id', '=', 'invoices.user_id')
                    ->LeftJoin('customers', 'customers.customer_id', '=', 'invoices.customer_id')
                    ->select('users.username', 'invoices.*', 'customers.customer', 'customers.account_number')
                    ->where('invoices.user_id', $this->createdFor())
                    ->orderBy('invoice_number', 'desc');
            }
        }

        return Datatables::of($invoices)
            ->addColumn('checkbox', function ($invoices) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$invoices->invoice_number.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$invoices->invoice_number.'"> 
                <label for="box-'.$invoices->invoice_number.'" class="checkinner"></label>';
            })
            ->addColumn('jobs', function ($invoices) {
                if (Booking::where('invoice_number', $invoices->invoice_number)->count() > 0) {
                    $view = '<div id="jobsModal-'.$invoices->invoice_number.'" class="modal fade" role="dialog">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Invoice#'.$invoices->invoice_number.' Jobs</h5>
                            </div>
                            <div class="modal-body">
                            <div class="table-responsive">
                                 <table class="table borderless">
                                     <tbody>';
                    foreach (Booking::where('invoice_number', $invoices->invoice_number)->where('booking_type', '!=', 'Quote')->limit(500)->get() as $jobs) {
                        $view .= '<tr>
                                             <td >
                                                <a href="'.route('booking.edit', ['id' => $jobs->job_ref]).'" target="_blank">View Job-'.$jobs->job_ref.' Details</a>                                       
                                             </td >
                                         </tr >';
                    }
                    $view .= '</tbody>
                                 </table>
                            </div>
                                
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>';
                    $view .= '<a href="javascripts:void(0)" data-toggle="modal" data-target="#jobsModal-'.$invoices->invoice_number.'" class="btn btn-outline-success btn-xs">
                               '.Booking::where('invoice_number', $invoices->invoice_number)->count().'
                            </a>';

                    return $view;
                } else {
                    return '<a href="javascript:viod(0)" class="btn btn-outline-dark btn-xs">'.
                        Booking::where('invoice_number', $invoices->invoice_number)->where('booking_type', '!=', 'Quote')->count().'</a>';
                }
            })
            ->addColumn('total', function ($invoices) {
                $subtotal = Booking::where('invoice_number', $invoices->invoice_number)->sum('cost');
                $extra = Booking::where('invoice_number', $invoices->invoice_number)->sum('extra_cost2');
                $vat = Usersettings::where('user_id', $this->createdFor())->first()->vat;
                $realVat = (($subtotal + $extra) * $vat) / 100;

                return config('booking.currency_symbol').number_format((($subtotal + $extra) + $realVat), 2);

            })
            ->addColumn('subtotal', function ($invoices) {
                $subtotal = Booking::where('invoice_number', $invoices->invoice_number)->sum('cost');

                return config('booking.currency_symbol').number_format($subtotal, 2);

            })
            ->addColumn('vat', function ($invoices) {
                $subtotal = Booking::where('invoice_number', $invoices->invoice_number)->sum('cost');
                $extra = Booking::where('invoice_number', $invoices->invoice_number)->sum('extra_cost2');
                $vat = Usersettings::where('user_id', $this->createdFor())->first()->vat;
                $realVat = (($subtotal + $extra) * $vat) / 100;

                return config('booking.currency_symbol').number_format($realVat, 2);
            })
            ->editColumn('invoice_number', function ($invoices) {
                if (Booking::where('invoice_number', $invoices->invoice_number)->count() > 0) {
                    return '<a href="'.route('invoices.details', ['id' => $invoices->invoice_number, 'customer' => $invoices->customer_id]).'" class="btn btn-outline-info btn-xs">'.
                        $invoices->invoice_number.'</a>';
                } else {
                    return '<a href="javascript:viod(0)" class="btn btn-outline-dark btn-xs">'.
                        $invoices->invoice_number.'</a>';
                }
            })
            ->editColumn('updated_at', function ($invoices) {
                if ($invoices->updated_at) {
                    return Carbon::parse($invoices->updated_at, config('timezone'))->format('dS M Y');
                }
            })
            ->editColumn('emailed', function ($invoices) {
                if ($invoices->emailed) {
                    return '<a href="javascript:void(0)" class="btn btn-outline-success btn-xs">sent</a>';
                } else {
                    return '<a href="javascript:void(0)" class="btn btn-outline-dark btn-xs">unsent</a>';
                }
            })
            ->addColumn('action', function ($invoices) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('invoices.details', ['id' => $invoices->invoice_number, 'customer' => $invoices->customer_id]).'"  class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$invoices->invoice_number.'" onclick="deleteData(\''.url('admin/invoices/delete').'\','.$invoices->invoice_number.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->filterColumn('account_number', function ($query, $keyword) {
                $query->whereRaw('customers.account_number  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('customer', function ($query, $keyword) {
                $query->whereRaw('customers.customer  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('emailed', function ($query, $keyword) {
                if ($keyword == 'sent') {
                    $query->whereRaw('invoices.emailed  like ?', [1]);
                } elseif ($keyword == 'unsent') {
                    $query->whereRaw('invoices.emailed  like ?', [0]);
                }
            })
            ->rawColumns(['checkbox', 'action', 'jobs', 'invoice_number', 'total', 'emailed', 'subtotal'])->make(true);
    }

    public function customerView(Request $request)
    {
        if (isset($_GET['date1'])) {
            $fromDate = Carbon::parse($_GET['date1'], config('app.timezone'))->format('Y-m-d');
            $toDate = Carbon::parse($_GET['date2'], config('app.timezone'))->format('Y-m-d');
        } else {
            $fromDate = Carbon::now()->format('Y-m-d');
            $toDate = Carbon::now()->format('Y-m-d');
        }

        return view('admin.invoices.customers', compact('fromDate', 'toDate'));
    }

    public function customerData($fromDate = null, $toDate = null)
    {
        $invoices = Booking::LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->select('booking.*', 'customers.customer as customerName')
            ->where(function ($where) use ($fromDate, $toDate) {
                if ($fromDate and $toDate) {
                    $where->whereBetween(DB::raw('DATE(booking.delivery_date)'), [$fromDate, $toDate]);
                }
            })
            ->groupBy('booking.customer')
            ->orderBy('customers.customer', 'asc');

        return Datatables::of($invoices)
            ->addColumn('action', function ($invoices) {
                if ($invoices->invoiced == 0) {
                    return '<a href="'.route('invoices.customers.invoiced', ['id' => $invoices->job_ref, 'status' => 1]).'" class="btn btn-outline-danger btn-xs" onclick="return confirm(\'Are you sure you want to continue?\')">Not Invoiced button</a>';
                } else {
                    return '<a href="javascript:void(0)" class="btn btn-success btn-xs">Invoiced</a>';
                }
            })
            ->filterColumn('customerName', function ($query, $keyword) {
                $query->whereRaw('customers.customer  like ?', ["%{$keyword}%"]);
            })
            ->rawColumns(['action'])->make(true);
    }

    public function invoiceStatus($id, $status)
    {
        if ($status) {
            $invoiced = Booking::findOrFail($id);
            $invoiced->invoiced = $status;
            $invoiced->save();

            return back()->with('success', 'Marked as invoiced');
        }

        return back()->with('error', 'Not updated');
    }

    public function details(Request $request, $id = null)
    {

        if ($request->input('checkbox')) {
            $customerId = $request->input('customer');

            $jobRef = $request->input('checkbox');
            $booked = Booking::whereIn('job_ref', $jobRef)->limit(1)->first();

            $data = Invoices::create([
                'user_id' => $this->createdFor(),
                'title' => 'Customer Invoice - '.$this->dateTime(),
                'created_at' => $this->dateTime(),
                'updated_at' => $this->dateYMD($request->input('updated_at')),
                'customer_id' => $booked->customer,
            ]);
            $invoiceNo = $data->invoice_number;
            // Update Job Invoice ID
            Booking::whereIn('job_ref', $jobRef)->update(['invoice_number' => $invoiceNo]);
            $bookings = Booking::whereIn('job_ref', $jobRef)->orderBy('collection_date')->get();
            $customer = Customers::where('customer_id', $booked->customer)->first();
            $subtotal = Booking::where('invoice_number', $invoiceNo)->sum('cost');
            $extra = Booking::where('invoice_number', $invoiceNo)->sum('extra_cost2');
            $invoices = Invoices::LeftJoin('user_settings', 'user_settings.user_id', '=', 'invoices.user_id')
                ->where('invoices.user_id', $this->createdFor())
                ->where('invoice_number', $invoiceNo)
                ->first();
        } elseif ($id) {
            $invoiceNo = 0;
            $customerId = $request->input('customer');
            $bookings = Booking::where('invoice_number', $id)->orderBy('collection_date')->get();
            $customer = Customers::where('customer_id', $customerId)->first();
            $subtotal = Booking::where('invoice_number', $id)->sum('cost');
            $extra = Booking::where('invoice_number', $invoiceNo)->sum('extra_cost2');
            $invoices = Invoices::LeftJoin('user_settings', 'user_settings.user_id', '=', 'invoices.user_id')
                ->where('invoices.user_id', $this->createdFor())
                ->where('invoice_number', $id)
                ->first();
        } else {
            return back()->withInput()->with('error', 'No Item(s) selected!');
        }

        $vat = (($subtotal + $extra) * $invoices->vat) / 100;
        $total = $subtotal + $extra + $vat;

        return view('admin.invoices.details', compact('invoices', 'bookings', 'customer', 'subtotal', 'vat', 'total', 'invoiceNo'));
    }

    public function invoiceAuto(Request $request)
    {
        $term = $request->input('term');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('invoices')
                ->where('invoice_number', 'LIKE', '%'.$term.'%')
                ->orWhere('title', 'LIKE', '%'.$term.'%')
                ->limit(10)->get();
        } else {
            $queries = DB::table('invoices')
                ->where(function ($query) use ($term) {
                    $query->where('invoice_number', 'LIKE', '%'.$term.'%')
                        ->orWhere('title', 'LIKE', '%'.$term.'%');
                })
                ->where('user_id', $this->createdFor())
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = [
                'number' => $query->invoice_number,
                'title' => $query->title,
            ];
        }

        return response()->json($results);

    }

    /**
     * This method load invoices form
     *
     * @return mixed
     */
    public function insert()
    {
        return view('admin.invoices.create');
    }

    public function store(Request $request)
    {
        /* validate invoices data */
        $validator = Validator::make($request->all(),
            [
                'title' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            $data = [
                'user_id' => $this->createdFor(),
                'title' => $request->input('title'),
                'notes' => $request->input('notes'),
                'updated_at' => $this->dateTime(),
            ];

            $data = Invoices::create($data);
            $this->addLog('Added Invoice');

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }


    public function edit($id)
    {
        $invoices = Invoices::findOrFail($id);

        /* pass invoices data to view and load list view */
        return view('admin.invoices.edit', compact('invoices'));
    }

    public function update($id, Request $request)
    {
        /* validate invoices data */
        $validator = Validator::make($request->all(),
            [
                'title' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $invoices = Invoices::findOrFail($id);
            $invoices->title = $request->input('title');
            $invoices->notes = $request->input('notes');
            $invoices->updated_at = $this->dateTime();
            $invoices->save();
            $this->addLog('Updated Invoice');

            return response()->json(['success' => true, 'message' => trans('app.update.success'),
            ]);
        }
    }

    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Booking::where('invoice_number', $id)->update(['invoice_number' => 0]);
            Invoices::findOrFail($id)->delete();
            $this->addLog('Deleted Invoice');

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function destroyFile2(Request $request, $id)
    {
        if ($request->ajax()) {
            $this->deleteFileWith($id);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Invoices::where('invoice_number', $id)->delete();
                $this->addLog('Deleted Invoice');
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    public function exportPDF(Request $request)
    {
        $invoices = Invoices::all();
        $pdf = Pdf::loadView('admin.invoices.print', compact('invoices'));

        return $pdf->download('invoices_data.pdf');
    }

    public function exportDetailPDF($id, Request $request)
    {
        $invoices = Invoices::LeftJoin('user_settings', 'user_settings.user_id', '=', 'invoices.user_id')
            ->where('invoice_number', $id)
            ->first();
        $bookings = Booking::where('invoice_number', $id)->get();
        $customer = Customers::where('customer_id', $request->input('customer'))->first();
        $subtotal = Booking::where('invoice_number', $id)->sum('cost');
        $extra = Booking::where('invoice_number', $id)->sum('extra_cost2');
        $vat = (($subtotal + $extra) * $invoices->vat) / 100;
        $total = ($subtotal + $extra) + $vat;
        $pdf = Pdf::loadView('admin.invoices.print-details', compact('invoices', 'bookings', 'customer', 'subtotal', 'vat', 'total'));
        $pdf->getDomPDF()->set_option('enable_php', true);
        $pdf->setPaper([0, -30, 620.78, 950.94], 'A4');

        return $pdf->download('invoice_'.$invoices->invoice_number.'.pdf');
    }

    /*
    * Send Email to Drive
    *
    * */
    public function sendinvoiceToMail(Request $request)
    {
        $invoice_number = $request->input('invoice_number');
        $customer = $request->input('customer');
        $email = $request->input('customer_email');
        if ($invoice_number and $email) {
            Mail::to($email)->send(new MailInvoice($invoice_number, $customer));
            Invoices::where('invoice_number', $invoice_number)->update(['emailed' => 1]);

            return response()->json(['success' => true, 'message' => 'Invoice '.$invoice_number.' has been sent to Customer email '.$email]);
        } else {
            return response()->json(['error' => true, 'message' => 'Oops something is not right!']);
        }
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.invoices.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('invoices_file')) {
            $path = $request->file('invoices_file')->getRealPath();
            Excel::import(new InvoicesImports, $path);

            return response()->json(['success' => true, 'message' => trans('app.import.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
    }

    /**
     * Export to csv and excel
     *
     * @return mixed
     */
    public function exportFile($type)
    {
        return (new InvoicesExports)->download('invoices.'.$type);
    }

    public function ExportToCsvSage(Request $request, $id = null)
    {
        $type = $request->input('type');
        if ($request->input('checkbox')) {
            $invId = $request->input('checkbox');
            $invoices = Invoices::join('booking', 'booking.invoice_number', '=', 'invoices.invoice_number')
                ->join('customers', 'invoices.customer_id', '=', 'customers.customer_id')
                ->join('user_settings', 'invoices.user_id', '=', 'user_settings.user_id')
                ->select('customers.account_number', 'invoices.updated_at', 'invoices.invoice_number', 'customers.customer',
                    DB::raw('SUM(booking.cost) AS total'),
                    DB::raw('SUM(booking.extra_cost2) AS extras'),
                    'user_settings.vat'
                )
                ->where('invoices.user_id', $this->createdFor())
                ->whereIn('invoices.invoice_number', $invId)
                ->groupBy('invoices.invoice_number')
                ->orderBy('invoices.invoice_number', 'desc')
                ->get();
        } else {
            return back()->withInput()->with('error', 'No Item(s) selected!');
        }

        $paymentsArray = [];
        if ($type == 'sage') {
            foreach ($invoices as $payment) {
                $vat = number_format((($payment->total) * $payment->vat) / 100, 2, '.', '');
                $total = number_format($payment->total, 2, '.', '');
                $date = Carbon::parse($payment->updated_at)->format('dmY');
                $paymentsArray[] = ['SI', $payment->account_number, '4001', '1', $date, $payment->invoice_number, 'Sameday Invoice', $total, 'T1', $vat];
            }
        } else {
            $paymentsArray[] = ['Account Number', 'Customer', 'Invoice Date', 'Invoice Number', 'NET Amount', 'VAT Amount'];
            foreach ($invoices as $payment) {
                $vat = number_format((($payment->total) * $payment->vat) / 100, 2, '.', '');
                $total = number_format($payment->total, 2, '.', '');
                $date = Carbon::parse($payment->updated_at)->format('d-m-Y');
                $paymentsArray[] = [$payment->account_number, $payment->customer, $date, $payment->invoice_number, $total, $vat];
            }
        }

        return (new CustomExports([$paymentsArray]))->download('invoice_'.rand(1,9999).'.csv');
    }
}
