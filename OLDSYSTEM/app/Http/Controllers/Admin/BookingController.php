<?php

namespace App\Http\Controllers\Admin;

use App\Exports\CustomExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\CustomQueries;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\BookingImports;
use App\Mail\MailJob;
use App\Models\Booking;
use App\Models\Bookingtypes;
use App\Models\CollectedOrders;
use App\Models\Customers;
use App\Models\Customervehiclerates;
use App\Models\Drivers;
use App\Models\Driverscontact;
use App\Models\Fuelsurcharges;
use App\Models\Jobaccess;
use App\Models\Storages;
use App\Models\Storageusage;
use App\Models\System\Upload;
use App\Models\Systemactivities;
use App\Models\Usersettings;
use App\Models\Vehicles;
use App\Models\Viaaddress;
use App\Notifications\AppNotification;
use Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class BookingController extends Controller
{
    use CustomQueries;
    use Uploader;

    /**
     * BookingController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    private function bookingTableTodayUrl(): string
    {
        $today = Carbon::now()->format('Y-m-d');

        return route('booking.index', ['user' => 0, 'date1' => $today, 'date2' => $today]);
    }

    /**
     * This method display booking view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request, $huser = null)
    {
        if ($request->input('date1')) {
            $fromDate = Carbon::parse($request->input('date1'), config('app.timezone'))->format('Y-m-d');
            $toDate = Carbon::parse($request->input('date2'), config('app.timezone'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }

        if ($request->input('customer') and strlen($request->input('customer')) > 0) {
            $customer = $request->input('customer');
            if ($customer > 0) {
                $customerName = Customers::where('customer_id', $customer)->first()->customer;
            }
        } else {
            $customer = 0;
            $customerName = 0;
        }
        if ($request->input('driver') and strlen($request->input('driver')) > 0) {
            $driver = $request->input('driver');
            if ($driver > 0) {
                $driverName = Drivers::where('driver_id', $driver)->first()->driver;
            }
        } else {
            $driver = 0;
            $driverName = 0;
        }
        if ($request->input('jobRef') and strlen($request->input('jobRef')) > 0) {
            $jobRef = $request->input('jobRef');
        } else {
            $jobRef = 0;
        }

        if (Auth::user()->hasRole('admin')) {
            if ($huser) {
                $users = $this->memberInfo($huser);
                $user = $huser;
            } else {
                $users = $this->memberInfo();
                $user = 0;
            }
        } else {
            $users = $this->memberInfo();
            $user = $this->createdFor();
        }
        $tomorrow = Carbon::now(config('timezone'))->addDay()->format('Y-m-d');

        $nextDayCount = Booking::where('delivery_date', $tomorrow)
            ->where(function ($query) {
                $query->where('driver', 0)->orWhereNull('driver');
            })
            ->where(function ($query) {
                $query->where('second_man', 0)->orWhereNull('second_man');
            })
            ->where(function ($query) {
                $query->where('cxdriver', 0)->orWhereNull('cxdriver');
            })
            ->count();
        $nextDay = Booking::where('delivery_date', $tomorrow)
            ->where(function ($query) {
                $query->where('driver', 0)->orWhereNull('driver');
            })
            ->where(function ($query) {
                $query->where('second_man', 0)->orWhereNull('second_man');
            })
            ->get();
        if (Auth::user()->hasRole('customer')) {
            if ($request->input('date1')) {
                $fromDate = Carbon::parse($request->input('date1'), config('app.timezone'))->format('Y-m-d');
                $toDate = Carbon::parse($request->input('date2'), config('app.timezone'))->format('Y-m-d');
            } else {
                $fromDate = Carbon::now(config('timezone'))->format('Y-m-d');
                $toDate = Carbon::now(config('timezone'))->format('Y-m-d');
            }
            $customerId = Auth::user()->customerId;
            $booking = $this->queries($fromDate, $toDate, $user, $customerId, '', 2);

            return view('customerAccess.index', compact('fromDate', 'toDate', 'customerId', 'booking'));
        } else {
            return view('admin.booking.index', compact('user', 'users', 'fromDate', 'toDate', 'customer', 'driver', 'customerName', 'driverName', 'nextDayCount', 'nextDay', 'jobRef'));
        }
    }

    /**
     * Load booking data for view table
     *
     * @return mixed
     *
     * @throws \Exception
     */
    public function getdata($user = null, $fromdate = null, $todate = null, $customer = null, $driver = null, $archive = null, $btype = null)
    {
        if ($archive) {
            $booking = $this->invoiceQueries($fromdate, $todate, $user, $customer, $driver, 1, $btype);
        } else {
            $booking = $this->queries2($fromdate, $todate, $user, $customer, $driver, 0);
        }

        // Fix #1: use updated DataTables facade
        return DataTables::of($booking)
            ->addColumn('checkbox', function ($booking) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$booking->job_ref.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$booking->job_ref.'"> 
                <label for="box-'.$booking->job_ref.'" class="checkinner"></label>';
            })
            ->setRowAttr([
                'style' => function ($booking) {
                    $viasTotal = Viaaddress::where('job_ref', $booking->job_ref)->whereNull('deleted_at')->count();
                    $viasSigned = Viaaddress::where('job_ref', $booking->job_ref)
                        ->where(function ($where) {
                            $where->where('signed_by', '!=', '')
                                ->orwhereNotNull('signed_by');
                        })->whereNull('deleted_at')->count();

                    if ($booking->booking_type == 'Quote') {
                        return 'background-color: #e0e0e0;'; // grey-light
                    }
                    if (($booking->pod == 1)) {
                        return 'background-color: #bbdefb;'; // blue lighten-4
                    }
                    if (($booking->driver or $booking->second_man or $booking->cxdriver) and $booking->job_status === 0 and strlen($booking->pod_signature) < 1 and strlen($booking->pod_time) < 1) {
                        return 'background-color: #fde43a;'; // amber-light
                    } elseif (($booking->driver or $booking->second_man or $booking->cxdriver) and $booking->pod_signature and $booking->job_status == 0 and strlen($booking->pod_signature) > 1 and strlen($booking->pod_time) > 1 and $booking->pod_data_verify === 1) {
                        if ($viasTotal === $viasSigned) {
                            return 'background-color: #b9f6ca;'; // light-green
                        } else {
                            return 'background-color: #fde43a;'; // amber-light
                        }
                    } elseif (($booking->driver or $booking->second_man or $booking->cxdriver) and $booking->pod_signature and $booking->job_status === 1 and strlen($booking->pod_signature) > 1 and strlen($booking->pod_time) > 1 and $booking->pod_data_verify === 1) {
                        if ($viasTotal === $viasSigned) {
                            return 'background-color: #b9f6ca;'; // light-green
                        } else {
                            return 'background-color: #fde43a;'; // amber-light
                        }
                    } elseif ((! $booking->driver and ! $booking->second_man and ! $booking->cxdriver)) {
                        return 'background-color: #ffcdd2;'; // red-light
                    } else {
                        return '';
                    }
                },
            ])
            ->editColumn('job_ref', function ($booking) {
                // For drivers only
                if (Auth::user()->hasRole('driver')) {
                    return '<a href="'.route('booking.details', ['id' => $booking->job_ref, 'driver' => 1]).'" class="btn btn-outline-success btn-xs">'.
                        $booking->customerId.'-'.$booking->job_ref.'';
                } else {
                    $vias = Viaaddress::where('job_ref', $booking->job_ref)->whereNull('deleted_at')->count();
                    if ($booking->job_notes) {
                        $note = '<span title="Has Job Notes" style="display:inline-flex;align-items:center;justify-content:center;background:#2563eb;color:#fff;border-radius:5px;padding:.15rem .35rem;font-size:.7rem;font-weight:700;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,.07);vertical-align:middle;"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'11\' height=\'11\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\' stroke-width=\'2\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z\'/></svg></span>';
                    } else {
                        $note = '';
                    }
                    if ($vias > 0) {
                        return '<a href="'.route('booking.edit', ['id' => $booking->job_ref, 'cust' => $booking->customer, 'edit' => 1]).'" class="btn btn-outline-success btn-xs">'.
                            $booking->customerId.'-'.$booking->job_ref.'</a><a href="#" class="btn btn-danger btn-xs" title="'.$vias.' Via Address">'.$vias.'</a> '.$note;
                    } else {
                        return '<a href="'.route('booking.edit', ['id' => $booking->job_ref, 'cust' => $booking->customer, 'edit' => 1]).'" class="btn btn-outline-success btn-xs">'.
                            $booking->customerId.'-'.$booking->job_ref.' '.$note;
                    }
                }
            })
            ->editColumn('created_at', function ($booking) {
                if ($booking->created_at) {
                    return Carbon::parse($booking->created_at, config('timezone'))->format('d/m/Y');
                }
            })
            ->editColumn('collection_date', function ($booking) {
                if ($booking->collection_date) {
                    return Carbon::parse($booking->collection_date, config('timezone'))->format('d/m/Y');
                }
            })
            ->editColumn('collection_time', function ($booking) {
                if ($booking->collection_time) {
                    return substr($booking->collection_time, 0, -3);
                }
            })
            ->editColumn('delivery_date', function ($booking) {
                if ($booking->delivery_date) {
                    return Carbon::parse($booking->delivery_date, config('timezone'))->format('d/m/Y');
                }
            })
            ->addColumn('from', function ($booking) {
                if ($booking->collection_postcode) {
                    return $booking->collection_postcode;
                } else {
                    return $booking->collection_postcode;
                }
            })
            ->addColumn('to', function ($booking) {
                if ($booking->delivery_postcode) {
                    return $booking->delivery_postcode;
                } else {
                    return $booking->delivery_postcode;
                }
            })
            ->addColumn('via1', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[0])) {
                        if ($signed[0] and $booking->pod !== 1 and $verify[0]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[0].'</span>';
                        } else {
                            if ($mobile[0]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[0].'</span>';
                            }

                            return $newme[0];
                        }
                    }
                }
            })
            ->addColumn('via2', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[1])) {
                        if ($signed[1] and $booking->pod !== 1 and $verify[1]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[1].'</span>';
                        } else {
                            if ($mobile[1]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[1].'</span>';
                            }

                            return $newme[1];
                        }
                    }
                }
            })
            ->addColumn('via3', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[2])) {
                        if ($signed[2] and $booking->pod !== 1 and $verify[2]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[2].'</span>';
                        } else {
                            if ($mobile[2]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[2].'</span>';
                            }

                            return $newme[2];
                        }
                    }
                }
            })
            ->addColumn('via4', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[3])) {
                        if ($signed[3] and $booking->pod !== 1 and $verify[3]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[3].'</span>';
                        } else {
                            if ($mobile[3]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[3].'</span>';
                            }

                            return $newme[3];
                        }
                    }
                }
            })
            ->addColumn('via5', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[4])) {
                        if ($signed[4] and $booking->pod !== 1 and $verify[4]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[4].'</span>';
                        } else {
                            if ($mobile[4]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[4].'</span>';
                            }

                            return $newme[4];
                        }
                    }
                }
            })
            ->addColumn('via6', function ($booking) {
                $via = Viaaddress::select('postcode', 'signed_by', 'via_pod_data_verify', 'via_pod_mobile')->where('job_ref', $booking->job_ref)->whereNull('deleted_at');
                if ($via->count() > 0) {
                    $signed = $via->pluck('signed_by');
                    $newme = $via->pluck('postcode');
                    $verify = $via->pluck('via_pod_data_verify');
                    $mobile = $via->pluck('via_pod_mobile');
                    if (isset($newme[5])) {
                        if ($signed[5] and $booking->pod !== 1 and $verify[5]) {
                            return '<span style="background-color: #b9f6ca; padding: 6px;">'.$newme[5].'</span>';
                        } else {
                            if ($mobile[5]) {
                                return '<span style="background-color: #ffcdd2; padding: 6px;">'.$newme[5].'</span>';
                            }

                            return $newme[5];
                        }
                    }
                }
            })
            ->editColumn('cost', function ($booking) {
                if ($booking->cost) {
                    return config('booking.currency_symbol').number_format(($booking->cost + $booking->extra_cost2), 2);
                }
            })
            ->addColumn('driverSum', function ($booking) {
                if ($booking->driver_cost or $booking->extra_cost or $booking->cxdriver_cost) {
                    return number_format(($booking->driver_cost + $booking->extra_cost + $booking->cxdriver_cost), 2);
                }
            })
            ->addColumn('driverName', function ($booking) {
                $driver = '';
                if ($booking->driverName and ! $booking->secondMan) {
                    $driver .= $booking->driverName;
                }
                if ($booking->secondMan and ! $booking->driverName) {
                    $driver .= $booking->secondMan;
                }
                if ($booking->secondMan and $booking->driverName) {
                    $driver .= $booking->driverName.' <br>'.$booking->secondMan;
                }

                return $driver.''.$booking->cxdriverName;
            })
            ->editColumn('invoice_number', function ($booking) {
                if ($booking->invoice_number) {
                    return '<a href="#" class="btn btn-outline-dark btn-xs">'.
                        $booking->invoice_number.'</a>';
                }
            })
            ->editColumn('job_status', function ($booking) {
                if ($booking->booking_type == 'Quote') {
                    return '<a href="javascript:viod(0)" class="btn btn-default btn-xs">Quote</a>';
                }
                if (($booking->driver or $booking->secondMan or $booking->cxdriver) and $booking->pod_signature and $booking->job_status == 0) {
                    if (($booking->cost + $booking->extra_cost2 - $booking->driver_cost - $booking->extra_cost - $booking->cxdriver_cost) > 0) {
                        return '<a href="'.route('booking.jobstatus', ['id' => $booking->job_ref, 'status' => 1]).'" class="btn btn-success btn-xs" onclick="return confirm(\'You are send this job to account?\')">Send To Acc</a>';
                    } else {
                        return '<a href="javascript:viod(0)" class="btn btn-danger btn-xs">Negative</a>';
                    }
                } elseif (($booking->driver or $booking->secondMan or $booking->cxdriver) and $booking->pod_signature and $booking->pod_time and $booking->job_status == 1) {
                    return '<a href="#" class="btn btn-success btn-xs">Completed</a>';
                } elseif (! $booking->driver and ! $booking->secondMan and ! $booking->cxdriver) {
                    return '<a href="javascript:viod(0)" class="btn btn-danger btn-xs">Driver Required</a>';
                } elseif (($booking->driver or $booking->secondMan or $booking->cxdriver) and $booking->job_status == 0 and strlen($booking->pod_signature) < 1) {
                    return '<a href="javascript:viod(0)" class="btn btn-outline-warning btn-xs">Processing</a>';
                }
            })
            ->editColumn('locker', function ($booking) {
                if ($booking->locker == 1) {
                    return '<a href="'.route('booking.locker', ['id' => $booking->job_ref]).'" class="btn btn-outline-danger btn-xs" onclick="return confirm(\'Allow mobile view\')">Locked</i></a>';
                }

                return '<a href="'.route('booking.locker', ['id' => $booking->job_ref]).'" class="btn btn-outline-success btn-xs" onclick="return confirm(\'Prevent mobile view\')">Opened</a>';
            })
            ->addColumn('action', function ($booking) {
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('booking.details', ['id' => $booking->job_ref]).'" class="btn btn-info btn-xs" title="Email Job"><i class="fa fa-send-o"></i></a> 
           <a href="'.route('booking.edit', ['id' => $booking->job_ref, 'cust' => $booking->customer, 'edit' => 1]).'" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$booking->job_ref.'" onclick="deleteData(\''.url('admin/booking/delete').'\','.$booking->job_ref.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a>
           <a href="'.route('booking.pod', ['id' => $booking->job_ref]).'" class="btn btn-secondary btn-xs" data-toggle="tooltip" title="Received POD" onclick="return confirm(\'Are you sure you want to change POD status?\')"><i class="fa fa-book"></i></a> 
           </div>';
            })
            ->filterColumn('customerName', function ($query, $keyword) {
                $query->whereRaw('customers.customer  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('driverName', function ($query, $keyword) {
                $query->whereRaw('drivers.driver  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('secondMan', function ($query, $keyword) {
                $query->whereRaw('drivers.driver  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('cxdriverName', function ($query, $keyword) {
                $query->whereRaw('drivers.driver  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('vehicleName', function ($query, $keyword) {
                $query->whereRaw('vehicles.name  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('from', function ($query, $keyword) {
                $query->whereRaw('booking.collection_postcode  like ?', ["%{$keyword}%"]);
            })
            ->filterColumn('to', function ($query, $keyword) {
                $query->whereRaw('booking.delivery_postcode  like ?', ["%{$keyword}%"]);
            })
            ->rawColumns(['checkbox', 'action', 'cost', 'invoice_number', 'job_ref', 'job_status', 'driverName', 'via1', 'via2', 'via3', 'via4', 'via5', 'via6', 'locker'])->make(true);
    }

    /**
     * This method select booking details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        $booking = Booking::LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->LeftJoin('user_settings', 'user_settings.user_id', '=', 'booking.user_id')
            ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
            ->select('booking.*', 'customers.customer', 'customers.account_number as customerId',
                'user_settings.upload_logo', 'vehicles.name as vehicleName',
                'drivers.driver as driverName', 'drivers.driver_email', 'drivers.driver_phone',
                'drivers_1.driver as driverName', 'drivers_2.driver as cxdriverName',
                'drivers_1.driver_email', 'drivers_1.driver_phone'
            )
            ->where('job_ref', $id)->first();
        $driver = Drivers::where('driver_id', $booking->driver)->orWhere('driver_id', $booking->second_man)->first();
        $viaAddresses = Viaaddress::where('job_ref', $id)->whereNull('deleted_at')->orderBy('via_id')->get();

        return view('admin.booking.details', compact('booking', 'viaAddresses', 'driver'));
    }

    /**
     * @return \Illuminate\Http\RedirectResponse
     */
    public function JobStatus($id, $status)
    {
        $booked = Booking::findOrFail($id);
        $booked->job_status = $status;
        $booked->save();

        return redirect()->route('booking.index', ['user' => 0])->with('success', 'Job '.$booked->job_ref.' has been moved to account!');
    }

    public function MultiJobStatus(Request $request)
    {
        $date1 = $request->input('date1');
        $date2 = $request->input('date2');
        Booking::whereBetween('delivery_date', [$date1, $date2])->update(['job_status' => 1]);

        return redirect()->route('booking.index', ['user' => 0])->with('success', 'Jobs for the the selected dates has been moved to account!');
    }

    /**
     * @param  null  $huser
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function InvoiceGen(Request $request, $huser = null)
    {
        if ($request->input('date1')) {
            $fromDate = Carbon::parse($request->input('date1'), config('app.timezone'))->format('Y-m-d');
            $toDate = Carbon::parse($request->input('date2'), config('app.timezone'))->format('Y-m-d');
        } else {
            $fromDate = 0;
            $toDate = 0;
        }
        if ($request->input('customer') and strlen($request->input('customer')) > 0) {
            $customer = $request->input('customer');
            if ($customer > 0) {
                $customerName = Customers::where('customer_id', $customer)->first()->customer;
            }
        } else {
            $customer = 0;
            $customerName = 0;
        }
        if ($request->input('btype') and strlen($request->input('btype')) > 0) {
            $btype = $request->input('btype');
        } else {
            $btype = 0;
        }
        if (Auth::user()->hasRole('admin')) {
            if ($huser) {
                $users = $this->memberInfo($huser);
                $user = $huser;
            } else {
                $users = $this->memberInfo();
                $user = 0;
            }
        } else {
            $users = $this->memberInfo();
            $user = $this->createdFor();
        }
        $types = Bookingtypes::limit(100)->get();

        return view('admin.booking.invoice', compact('fromDate', 'toDate', 'users', 'user', 'customer', 'customerName', 'types', 'btype'));
    }

    /* Collection Details */
    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function collectionAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];

        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('booking')
                ->where('collection_name', 'LIKE', '%'.$term.'%')
                ->orWhere('collection_postcode', 'LIKE', '%'.$term.'%')
                ->groupBy('customer')
                ->limit(10)->get();
        } else {
            $queries = DB::table('booking')
                ->where(function ($query) use ($term) {
                    $query->where('collection_name', 'LIKE', '%'.$term.'%')
                        ->orWhere('collection_postcode', 'LIKE', '%'.$term.'%');
                })
                ->where('user_id', $this->createdFor())
                ->groupBy('customer')
                ->limit(10)->get();
        }

        foreach ($queries as $query) {
            $results[] = [
                'id' => $query->customer,
                'value' => $query->collection_name,
                'address1' => $query->collection_address1,
                'address2' => $query->collection_address2,
                'area' => $query->collection_area,
                'country' => $query->collection_country,
                'postcode' => $query->collection_postcode,
            ];
        }

        return response()->json($results);
    }

    /* Delivery Details */
    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function deliveryAuto(Request $request)
    {
        $term = $request->input('searchText');
        $results = [];
        if (Auth::user()->hasRole('admin')) {
            $queries = DB::table('booking')
                ->where('delivery_name', 'LIKE', '%'.$term.'%')
                ->orWhere('delivery_postcode', 'LIKE', '%'.$term.'%')
                ->groupBy('customer')
                ->limit(10)->get();
        } else {
            $queries = DB::table('booking')
                ->where(function ($query) use ($term) {
                    $query->where('delivery_name', 'LIKE', '%'.$term.'%')
                        ->orWhere('delivery_postcode', 'LIKE', '%'.$term.'%');
                })
                ->where('user_id', $this->createdFor())
                ->groupBy('customer')
                ->limit(10)->get();
        }
        foreach ($queries as $query) {
            $results[] = [
                'id' => $query->customer,
                'value' => $query->delivery_name,
                'address1' => $query->delivery_address1,
                'address2' => $query->delivery_address2,
                'area' => $query->delivery_area,
                'country' => $query->delivery_country,
                'postcode' => $query->delivery_postcode,
            ];
        }

        return response()->json($results);
    }

    /**
     * This method load booking form
     *
     * @return mixed
     */
    public function insert(Request $request)
    {
        if ($request->input('cust') and strlen($request->input('cust') > 0)) {
            $id = $request->input('cust');
            $customers = Customers::where('customer_id', $id)->first();
            $customer = $customers->customer;
            $bookings = Booking::where('customer', $id)->limit(200)->get();
            $rates = Customervehiclerates::LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
                ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
                ->select('vehicles.name', 'vehicles.id', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
                ->where('customers.customer_id', $id)
                ->orderBy('vehicles.name', 'asc')
                ->get();
            $drivers = Drivers::where('driver_type', 'Driver')->orderBy('driver', 'asc')->limit('2000')->get();
            $secondMan = Drivers::where('driver_type', 'SubContractor')->orderBy('driver', 'asc')->limit('2000')->get();
            $cxDriver = Drivers::where('driver_type', 'CXDriver')->orderBy('driver', 'asc')->limit('2000')->get();
            $vehicles = Vehicles::where('user_id', $this->createdFor())->limit('1000')->orderBy('name', 'asc')->get();
        } else {
            $customer = 0;
            $customers = 0;
            $bookings = 0;
            $rates = 0;
            $drivers = 0;
            $secondMan = 0;
            $cxDriver = 0;
            $id = 0;
            $vehicles = [];
        }
        if (Auth::user()->hasRole('booking1')) {
            $display = 'display: none';
        } else {
            $display = '';
        }
        $units = Storages::where('availability', 'Yes')->limit('500')->orderBy('id')->get();
        $types = Bookingtypes::limit(1000)->get();

        return view('admin.booking.create', compact('customer', 'rates', 'id', 'bookings', 'customers', 'secondMan', 'drivers', 'cxDriver', 'types', 'vehicles', 'display', 'units'));
    }

    public function getMile()
    {
        $collection_address1 = request()->input('collection_address1').',';
        if (request()->input('collection_address2')) {
            $collection_address2 = request()->input('collection_address2').',';
        } else {
            $collection_address2 = '';
        }
        if (request()->input('collection_area')) {
            $collection_area = request()->input('collection_area').',';
        } else {
            $collection_area = '';
        }
        if (request()->input('collection_country')) {
            $collection_country = request()->input('collection_country').',';
        } else {
            $collection_country = '';
        }
        if (request()->input('collection_postcode')) {
            $collection_postcode = request()->input('collection_postcode').',';
        } else {
            $collection_postcode = '';
        }
        // Destination
        $delivery_address1 = request()->input('delivery_address1').',';
        if (request()->input('delivery_address2')) {
            // Fix #5: was incorrectly using collection_address2 here
            $delivery_address2 = request()->input('delivery_address2').',';
        } else {
            $delivery_address2 = '';
        }
        if (request()->input('delivery_area')) {
            $delivery_area = request()->input('delivery_area').',';
        } else {
            $delivery_area = '';
        }
        if (request()->input('delivery_country')) {
            $delivery_country = request()->input('delivery_country').',';
        } else {
            $delivery_country = '';
        }
        if (request()->input('delivery_postcode')) {
            $delivery_postcode = request()->input('delivery_postcode').',';
        } else {
            $delivery_postcode = '';
        }
        $origin = trim(str_replace(' ', '+', $collection_address1.$collection_address2.$collection_area.$collection_postcode.$collection_country));
        $destination = trim(str_replace(' ', '+', $delivery_address1.$delivery_address2.$delivery_area.$delivery_postcode.$delivery_country));

        $params = [
            'units' => 'imperial',
            'origins' => $origin,
            'destinations' => $destination,
            'key' => config('services.google.api_key'),
        ];

        if (request()->input('avoid_tolls')) {
            $params['avoid'] = 'tolls';
        }

        $response = Http::get('https://maps.googleapis.com/maps/api/distancematrix/json', $params);

        $response_a = $response->json();

        if ($response_a['rows'][0]['elements'][0]['status'] == 'OK') {
            $mileData = str_replace(['mi', ' ', ','], '', $response_a['rows'][0]['elements'][0]['distance']['text']);
            $time = $response_a['rows'][0]['elements'][0]['duration']['text'];
            if (is_numeric($mileData)) {
                $mile = $mileData;
            } else {
                return back()->withInput()->with('error', 'Invalid Mile Information');
            }
            $cost = $mile * (request()->input('perMile') / 100);
            $vehicleCost = explode('|', request()->input('vehicleCost'));
            // STORE SESSION
            request()->session()->put('perMile', request()->input('perMile'));
            request()->session()->put('miles', $mile);
            request()->session()->put('time', $time);
            request()->session()->put('cost', $cost);
            request()->session()->put('from', $origin);
            request()->session()->put('to', $destination);
            request()->session()->put('vehicleInfo', request()->input('vehicleInfo'));
            request()->session()->put('vehicle', request()->input('vehicle'));
            request()->session()->put('vehicleCost', ['rate' => $vehicleCost[0], 'id' => $vehicleCost[1], 'name' => $vehicleCost[2]]);

            request()->session()->flash('collection_name', request()->input('collection_name'));
            request()->session()->flash('collection_address1', request()->input('collection_address1'));
            request()->session()->flash('collection_address2', request()->input('collection_address2'));
            request()->session()->flash('collection_area', request()->input('collection_area'));
            request()->session()->flash('collection_country', request()->input('collection_country'));
            request()->session()->flash('collection_postcode', request()->input('collection_postcode'));
            request()->session()->flash('collection_phone', request()->input('collection_phone'));
            request()->session()->flash('collection_contact', request()->input('collection_contact'));

            request()->session()->flash('delivery_name', request()->input('delivery_name'));
            request()->session()->flash('delivery_address1', request()->input('delivery_address1'));
            request()->session()->flash('delivery_address2', request()->input('delivery_address2'));
            request()->session()->flash('delivery_area', request()->input('delivery_area'));
            request()->session()->flash('delivery_country', request()->input('delivery_country'));
            request()->session()->flash('delivery_postcode', request()->input('delivery_postcode'));
            request()->session()->flash('delivery_phone', request()->input('delivery_phone'));
            request()->session()->flash('delivery_contact', request()->input('delivery_contact'));

            return true;
        } else {
            return false;
        }
    }

    public function store(Request $request)
    {
        /* GET MILEAGE INFO */
        if ($request->input('button') == 'Get Mileage and Costs') {
            return back()->withInput()->with('error', 'Something went wrong with Google API');
        }
        /* INSERT DATA */
        else {
            $validator = Validator::make($request->all(),
                [
                    'customer' => 'required',
                    'purchase_order' => 'required',
                    'weight' => 'required',
                    'number_of_items' => 'required',
                ]
            );
            // Fix #7: removed duplicate withInput() call
            if ($validator->fails()) {
                return back()->withInput()->withErrors($validator);
            } else {
                /* get post data */
                $chill = $request->input('chill_unit');
                $ambient = $request->input('ambient_unit');
                $driver = $request->input('driver');
                $secondMan = $request->input('second_man');
                $cxdriver = $request->input('cxdriver');
                $driver_contact = $request->input('driver_contact');

                if (strlen($request->input('manual_amount')) > 0) {
                    $cost = $request->input('manual_amount');
                } else {
                    $cost = $request->input('cost');
                }
                if ($request->input('avoid_tolls')) {
                    $avoid_tolls = 1;
                } else {
                    $avoid_tolls = 0;
                }
                if ((int) $request->input('weekend') === 1) {
                    $weekend = 1; // Weekend / Bank Holiday
                } elseif ((int) $request->input('weekend') === 3) {
                    $weekend = 2; // Out Of Hours
                } else {
                    $weekend = 0; // Normal
                }
                $data = [
                    'user_id' => $this->createdFor(),
                    'customer' => $request->input('customer'),
                    'customer_price' => $request->input('customer_price'),
                    'purchase_order' => $request->input('purchase_order'),
                    'miles' => $request->input('miles'),
                    'cost' => $cost,
                    'time_covered' => $request->input('time_covered'),
                    'collection_date' => $this->dateYMD($request->input('collection_date')),
                    'collection_time' => $request->input('collection_time') ?: '00:00',
                    'collection_name' => $request->input('collection_name'),
                    'collection_address1' => $request->input('collection_address1'),
                    'collection_address2' => $request->input('collection_address2'),
                    'collection_area' => $request->input('collection_area'),
                    'collection_country' => $request->input('collection_country'),
                    'collection_postcode' => $request->input('collection_postcode'),
                    'collection_contact' => $request->input('collection_contact'),
                    'collection_phone' => $request->input('collection_phone'),
                    'collection_notes' => $request->input('collection_notes'),
                    'delivery_date' => $this->dateYMD($request->input('delivery_date')),
                    'delivery_time' => $request->input('delivery_time') ?: '00:00',
                    'delivery_name' => $request->input('delivery_name'),
                    'delivery_address1' => $request->input('delivery_address1'),
                    'delivery_address2' => $request->input('delivery_address2'),
                    'delivery_area' => $request->input('delivery_area'),
                    'delivery_country' => $request->input('delivery_country'),
                    'delivery_postcode' => $request->input('delivery_postcode'),
                    'delivery_contact' => $request->input('delivery_contact'),
                    'delivery_phone' => $request->input('delivery_phone'),
                    'delivery_notes' => $request->input('delivery_notes'),
                    'pod_signature' => $request->input('pod_signature'),
                    'pod_time' => $request->input('pod_time'),
                    'invoice_number' => $request->input('invoice_number'),
                    'office_notes' => $request->input('office_notes'),
                    'vehicle' => $request->input('vehicle'),
                    'driver' => $request->input('driver'),
                    'driver_cost' => $request->input('driver_cost'),
                    'second_man' => $request->input('second_man'),
                    'extra_cost' => $request->input('extra_cost'),
                    'extra_cost2' => $request->input('extra_cost2'),
                    'cxdriver' => $request->input('cxdriver'),
                    'cxdriver_cost' => $request->input('cxdriver_cost'),
                    'created_by' => $this->memberId(),
                    'updated_by' => $this->memberId(),
                    'booked_by' => $request->input('booked_by'),
                    'number_of_items' => $request->input('number_of_items'),
                    'weight' => $request->input('weight'),
                    'booking_type' => $request->input('booking_type'),
                    'manual_amount' => $request->input('manual_amount'),
                    'manual_desc' => $request->input('manual_desc'),
                    'extra_cost2_label' => $request->input('extra_cost2_label'),
                    'dead_mileage_status' => $request->input('dead_mileage_status'),
                    'job_notes' => $request->input('job_notes'),
                    'driver_contact' => $request->input('driver_contact'),
                    'chill_unit' => $request->input('chill_unit'),
                    'ambient_unit' => $request->input('ambient_unit'),
                    'delivered_temperature' => $request->input('delivered_temperature'),
                    'fuel_surcharge_percent' => $request->input('fuel_surcharge_percent'),
                    'fuel_surcharge_cost' => $request->input('fuel_surcharge_cost'),
                    'avoid_tolls' => $avoid_tolls,
                    'weekend' => $weekend,
                    'hide_tracking_temperature' => $request->boolean('hide_tracking_temperature') ? 1 : 0,
                    'hide_tracking_map' => $request->boolean('hide_tracking_map') ? 1 : 0,
                ];
                $booking = Booking::create($data);

                if ($request->input('pod_date')) {
                    $booking->update(['pod_date' => $this->dateYMD($request->input('pod_date'))]);
                }

                if ($driver_contact || $driver || $secondMan || $cxdriver) {
                    $currentDriver = $driver ?: ($driver_contact ?: ($secondMan ?: $cxdriver));

                    // unit 1 chill_unit — use the saved booking's unit ID as fallback
                    $chillId = $chill ?: $booking->chill_unit;
                    if ($chillId) {
                        $chillInfo = Storages::where('id', $chillId)->where('availability', 'Yes');
                        if ($chillInfo->count()) {
                            $chillInfo->update(['current_driver' => $currentDriver, 'availability' => 'No', 'job_id' => $booking->job_ref, 'trackable' => 1]);
                            Storageusage::updateOrCreate(
                                ['job_id' => $booking->job_ref, 'unit_id' => $chillId],
                                ['unit_id' => $chillId, 'job_id' => $booking->job_ref, 'driver_id' => $currentDriver]
                            );
                        } else {
                            // Unit already assigned — just ensure trackable is on
                            Storages::where('id', $chillId)->update(['trackable' => 1]);
                        }
                    }
                    // unit 2 ambient_unit
                    $ambientId = $ambient ?: $booking->ambient_unit;
                    if ($ambientId) {
                        $ambientInfo = Storages::where('id', $ambientId)->where('availability', 'Yes');
                        if ($ambientInfo->count()) {
                            $ambientInfo->update(['current_driver' => $currentDriver, 'availability' => 'No', 'job_id' => $booking->job_ref, 'trackable' => 1]);
                            Storageusage::updateOrCreate(
                                ['job_id' => $booking->job_ref, 'unit_id' => $ambientId],
                                ['unit_id' => $ambientId, 'job_id' => $booking->job_ref, 'driver_id' => $currentDriver]
                            );
                        } else {
                            // Unit already assigned — just ensure trackable is on
                            Storages::where('id', $ambientId)->update(['trackable' => 1]);
                        }
                    }
                }

                /* Logic for multiple upload */
                if ($request->hasFile('filename')) {
                    $rules = [];
                    $filez = count($request->file('filename'));
                    foreach (range(0, $filez) as $index) {
                        $rules['filename.'.$index] = $this->imageRules();
                    }
                    $valFile = Validator::make($request->all(), $rules);
                    if ($valFile->fails()) {
                        return response()->json(['error' => true, 'message' => $valFile->errors()->all()]);
                    } else {
                        $filekey = $request->file('filename');
                        $this->multipleupload($filekey, $booking->job_ref, 'booking', 'resize');
                    }
                }

                /* Save address */
                Viaaddress::firstOrCreate(
                    [
                        'name' => $request->input('collection_name'),
                    ],
                    [
                        'user_id' => $this->createdFor(),
                        'job_ref' => '',
                        'via_type' => 'Collection',
                        'name' => $request->input('collection_name'),
                        'address1' => $request->input('collection_address1'),
                        'address2' => $request->input('collection_address2'),
                        'area' => $request->input('collection_area'),
                        'country' => $request->input('collection_country'),
                        'postcode' => $request->input('collection_postcode'),
                        'notes' => $request->input('collection_notes'),
                        'phone' => $request->input('collection_phone'),
                        'contact' => $request->input('collection_contact'),
                    ]
                );
                Viaaddress::firstOrCreate(
                    [
                        'name' => $request->input('delivery_name'),
                    ],
                    [
                        'user_id' => $this->createdFor(),
                        'job_ref' => '',
                        'via_type' => 'Delivery',
                        'name' => $request->input('delivery_name'),
                        'address1' => $request->input('delivery_address1'),
                        'address2' => $request->input('delivery_address2'),
                        'area' => $request->input('delivery_area'),
                        'country' => $request->input('delivery_country'),
                        'postcode' => $request->input('delivery_postcode'),
                        'notes' => $request->input('delivery_notes'),
                        'contact' => $request->input('delivery_contact'),
                        'phone' => $request->input('delivery_phone'),
                    ]
                );
                /* Process Via Addresses */
                for ($num = 1; $num <= 6; $num++) {
                    $address1 = $request->input('address1-'.$num);
                    if ($address1) {
                        foreach ($address1 as $key => $value) {
                            if ($value) {
                                Viaaddress::create([
                                    'user_id' => $this->createdFor(),
                                    'job_ref' => $booking->job_ref,
                                    'via_type' => $request->input('via_type-'.$num)[$key],
                                    'name' => $request->input('name-'.$num)[$key],
                                    'address1' => $request->input('address1-'.$num)[$key],
                                    'address2' => $request->input('address2-'.$num)[$key],
                                    'area' => $request->input('area-'.$num)[$key],
                                    'country' => $request->input('country-'.$num)[$key],
                                    'postcode' => $request->input('postcode-'.$num)[$key],
                                    'phone' => $request->input('phone-'.$num)[$key],
                                    'contact' => $request->input('contact-'.$num)[$key],
                                    'notes' => $request->input('notes-'.$num)[$key],
                                    'signed_by' => $request->input('signed_by-'.$num)[$key],
                                    'date' => $this->dateYMD($request->input('pod_date-'.$num)[$key]),
                                    'time' => $request->input('pod_time-'.$num)[$key],
                                    'via_date' => $this->dateYMD($request->input('via_date-'.$num)[$key]),
                                    'via_time' => $request->input('via_time-'.$num)[$key],
                                    'delivered_temperature' => $request->input('delivered_temperature-'.$num)[$key],
                                ]);
                            }
                        }
                    }
                }

                // Collected Orders MAIN
                if ($request->input('orders')) {
                    $orders = $request->input('orders');
                    // Fix #6: removed unused $type variable
                    foreach ($orders as $order) {
                        $order_number = isset($order['collected_orders']) ? $order['collected_orders'] : '';
                        $ambience = isset($order['collected_ambience']) ? $order['collected_ambience'] : 0;
                        $chill = isset($order['collected_chill']) ? $order['collected_chill'] : 0;
                        $pump = isset($order['collected_pump']) ? $order['collected_pump'] : 0;
                        $stores = isset($order['collected_stores']) ? $order['collected_stores'] : 0;
                        $orderId = isset($order['orderId']) ? $order['orderId'] : 0;
                        if ($order_number) {
                            CollectedOrders::updateOrCreate(
                                ['id' => $orderId],
                                [
                                    'booking_id' => $booking->job_ref,
                                    'type' => 'main',
                                    'order_number' => $order_number,
                                    'ambience' => $ambience,
                                    'chill' => $chill,
                                    'pump' => $pump,
                                    'stores' => $stores,
                                ]
                            );
                        }
                    }
                }

                // Collected Orders VIAS
                for ($num = 1; $num <= 6; $num++) {
                    if ($request->input('orders'.$num)) {
                        $orders2 = $request->input('orders'.$num);
                        foreach ($orders2 as $order) {
                            $order_number2 = $order['collected_orders'.$num] ?? '';
                            $ambience2 = $order['collected_ambience'.$num] ?? 0;
                            $chill2 = $order['collected_chill'.$num] ?? 0;
                            $pump2 = $order['collected_pump'.$num] ?? 0;
                            $stores2 = $order['collected_stores'.$num] ?? 0;
                            $viaId = $order['viaId'] ?? 0;
                            $orderId = $order['orderId'] ?? 0;

                            if ($order_number2) {
                                CollectedOrders::updateOrCreate(
                                    [
                                        'id' => $orderId,
                                        'type' => 'via',
                                        'via' => $viaId,
                                    ],
                                    [
                                        'booking_id' => $booking->job_ref,
                                        'type' => 'via',
                                        'via' => $viaId,
                                        'order_number' => $order_number2,
                                        'ambience' => $ambience2,
                                        'chill' => $chill2,
                                        'pump' => $pump2,
                                        'stores' => $stores2,
                                    ]
                                );
                            }
                        }
                    }
                }
                $this->sendDriverNotification($booking, $driver, $secondMan, $cxdriver, 1);
                $this->createGeocode($booking->job_ref);
                $request->session()->forget(['perMile', 'miles', 'time', 'cost', 'from', 'to', 'vehicleInfo', 'vehicle']);
                $this->addLog('New Job '.$booking->job_ref, $booking->job_ref);

                return redirect()->route('booking.edit', ['id' => $booking->job_ref, 'cust' => $booking->customer])->with('success', 'Record Added Successfully.');
            }
        }
    }

    /**
     * Select booking edit
     */
    public function edit($id)
    {
        $userId = Auth::user()->id;
        $previous = url()->previous();
        if (strpos($previous, 'booking/edit') === false) {
            request()->session()->put('previous', $previous);
        }

        if (! Auth::user()->hasRole('customer')) {
            // Lock TTL: 60 seconds. A lock is considered stale if not refreshed within that time.
            $lockTtl = 60;
            $staleLock = Jobaccess::where('job_id', $id)
                ->where('user_id', '!=', $userId)
                ->where('access', 1)
                ->where('updated_at', '>=', now()->subSeconds($lockTtl))
                ->first();

            if ($staleLock) {
                // Another user is actively viewing — show a simple "job is in use" page
                $lockedBy = \App\User::find($staleLock->user_id);
                return view('admin.booking.locked', [
                    'lockedBy' => $lockedBy ? $lockedBy->name : 'Another user',
                    'jobRef'   => $id,
                ]);
            }

            // Claim or refresh the lock for the current user
            // (clears any stale locks from other users first)
            Jobaccess::where('job_id', $id)->where('user_id', '!=', $userId)->delete();
            Jobaccess::updateOrCreate(
                ['job_id' => $id, 'user_id' => $userId],
                ['job_id' => $id, 'user_id' => $userId, 'access' => 1]
            );
        }

        $booking = DB::table('booking')
            ->LeftJoin('users', 'users.id', '=', 'booking.user_id')
            ->LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->LeftJoin('drivers as drivers_2', 'drivers_2.driver_id', '=', 'booking.cxdriver')
            ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->LeftJoin('customer_vehicle_rates', 'customer_vehicle_rates.customer_id', '=', 'booking.customer')
            ->LeftJoin('storages', 'storages.id', '=', 'booking.chill_unit')
            ->LeftJoin('storages as storages_1', 'storages_1.id', '=', 'booking.ambient_unit')
            ->select('booking.*', 'users.username', 'customers.customer as customerName', 'customers.po_number',
                'drivers.driver as driverName', 'drivers.driver_id as driverId', 'drivers.cost_per_mile',
                'drivers.cost_per_mile_weekends',
                'drivers.cost_per_mile_out_of_hours',
                'vehicles.name as vehicleName', 'drivers_1.driver as secondMan',
                'drivers_1.cost_per_mile as secondCostPerMile',
                'drivers_1.cost_per_mile_weekends as secondCostPerMileWeekends',
                'drivers_1.cost_per_mile_out_of_hours as secondCostPerMileOutOfHours',
                'drivers_2.driver as cxdriverName', 'drivers_2.cost_per_mile as cxCostPerMile',
                'drivers_2.cost_per_mile_weekends as cxCostPerMileWeekends',
                'drivers_2.cost_per_mile_out_of_hours as cxCostPerMileOutOfHours',
                'customer_vehicle_rates.rate_per_mile', 'vehicles.id as rateId',
                'storages.unit_number as chillUnit', 'storages_1.unit_number as ambientUnit',
                'storages.unit_size as chillSize', 'storages_1.unit_size as ambientSize'
            )
            ->where('booking.job_ref', $id)
            ->get()->first();
        $customers = Customers::where('customer_id', $booking->customer)->first();
        $addresses = Viaaddress::where('job_ref', $id)->whereNull('deleted_at')->orderBy('via_id')->get();
        $rates = Customervehiclerates::LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
            ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
            ->select('vehicles.name', 'vehicles.id', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
            ->where('customers.customer_id', $booking->customer)
            ->orderBy('vehicles.name', 'asc')
            ->get();
        $rate1 = Customervehiclerates::LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
            ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
            ->select('vehicles.name', 'vehicles.id', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
            ->where('customer_vehicle_rates.customer_id', $booking->customer)
            ->where('customer_vehicle_rates.vehicle_id', $booking->rateId)
            ->orderBy('vehicles.name', 'asc')
            ->first();
        $drivers = Drivers::where('driver_type', 'Driver')->orderBy('driver', 'asc')->limit('2000')->get();
        $secondMan = Drivers::where('driver_type', 'SubContractor')->orderBy('driver', 'asc')->limit('2000')->get();
        $cxDriver = Drivers::where('driver_type', 'CXDriver')->orderBy('driver', 'asc')->limit('2000')->get();

        $activities = Systemactivities::join('users', 'users.id', '=', 'system_activities.user_id')
            ->select('users.username', 'system_activities.*')
            ->where('system_activities.job_ref', $id)
            ->orderBy('system_activities.id', 'desc')
            ->limit(30)
            ->get();

        $uploads = Upload::where('relatedId', $booking->job_ref)->where('tablekey', 'booking')->get();
        $vehicles = Vehicles::where('user_id', $this->createdFor())->limit('1000')->orderBy('name', 'asc')->get();
        $types = Bookingtypes::limit('100')->get();
        $units = Storages::where('availability', 'Yes')->limit('500')->orderBy('id')->get();

        $collectedOrdersMain = CollectedOrders::where('booking_id', $booking->job_ref)->where('type', 'main')->limit('200')->orderBy('id')->get();
        $collectedOrdersVia = CollectedOrders::where('booking_id', $booking->job_ref)->where('type', 'via')->limit('200')->orderBy('id')->get();

        $from = trim(str_replace(' ', '+', $booking->collection_address1.' '.$booking->collection_address2.' '.$booking->collection_area.' '.$booking->collection_postcode.' '.$booking->collection_country));
        $to = trim(str_replace(' ', '+', $booking->delivery_address1.' '.$booking->delivery_address2.' '.$booking->delivery_area.' '.$booking->delivery_postcode.' '.$booking->delivery_country));

        if (Auth::user()->hasRole('booking1')) {
            $display = 'display: none';
        } else {
            $display = '';
        }
        $fuel = null; // fuel surcharge tiers are now hardcoded in the view

        if (Auth::user()->hasRole('customer')) {
            return view('customerAccess.details', compact('booking', 'addresses', 'rates', 'rate1', 'from', 'to', 'drivers', 'secondMan', 'cxDriver', 'activities', 'customers', 'types', 'vehicles', 'uploads', 'display', 'collectedOrdersMain', 'collectedOrdersVia'));
        } else {
            return view('admin.booking.edit', compact('booking', 'addresses', 'rates', 'rate1', 'from', 'to', 'drivers', 'secondMan', 'cxDriver', 'activities', 'customers', 'types', 'vehicles', 'uploads', 'display', 'units', 'collectedOrdersMain', 'collectedOrdersVia', 'fuel'));
        }
    }

    /**
     * Return GPS location + temperature for storage units attached to a booking.
     * Used by the customer-facing details view map.
     */
    public function unitLocations($id)
    {
        $booking = DB::table('booking')
            ->leftJoin('storages',       'storages.id',   '=', 'booking.chill_unit')
            ->leftJoin('storages as s2', 's2.id',         '=', 'booking.ambient_unit')
            ->select(
                'booking.chill_unit',
                'booking.ambient_unit',
                'booking.pod_data_verify',
                'booking.pod_signature',
                'booking.pod_time',
                'booking.hide_tracking_temperature',
                'booking.hide_tracking_map',
                'storages.imei      as chill_imei',
                'storages.unit_number as chill_number',
                'storages.unit_type as chill_type',
                's2.imei            as ambient_imei',
                's2.unit_number     as ambient_number',
                's2.unit_type       as ambient_type'
            )
            ->where('booking.job_ref', $id)
            ->first();

        if (! $booking) {
            return response()->json([]);
        }

        $viasPending = Viaaddress::where('job_ref', $id)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('signed_by')->orWhere('signed_by', '');
            })
            ->count();

        $podComplete = (int) ($booking->pod_data_verify ?? 0) === 1
            && strlen(trim((string) ($booking->pod_signature ?? ''))) > 0
            && strlen(trim((string) ($booking->pod_time ?? ''))) > 0;

        $isTrackingCompleted = $podComplete && $viasPending === 0;
        $isMapHidden = (int) ($booking->hide_tracking_map ?? 0) === 1;
        $isTempHidden = (int) ($booking->hide_tracking_temperature ?? 0) === 1;

        if ($isTrackingCompleted || $isMapHidden) {
            return response()->json([]);
        }

        $imeis = array_filter([
            $booking->chill_imei   ? [
                'imei'   => $booking->chill_imei,
                'kind'   => strtolower(trim($booking->chill_type   ?? '')) ?: 'chill',
                'number' => $booking->chill_number,
                'label'  => ($booking->chill_type   ?: 'Unit').' ('.$booking->chill_number.')',
            ] : null,
            $booking->ambient_imei ? [
                'imei'   => $booking->ambient_imei,
                'kind'   => strtolower(trim($booking->ambient_type ?? '')) ?: 'ambient',
                'number' => $booking->ambient_number,
                'label'  => ($booking->ambient_type ?: 'Unit').' ('.$booking->ambient_number.')',
            ] : null,
        ]);

        if (empty($imeis)) {
            return response()->json([]);
        }

        $service   = app(\App\Services\StorageService::class);
        $rawImeis  = array_column(array_values($imeis), 'imei');

        $locations = $service->getUnitLocations($rawImeis);

        $labelMap = [];
        foreach ($imeis as $entry) {
            $labelMap[$entry['imei']] = ['label' => $entry['label'], 'kind' => $entry['kind'], 'number' => $entry['number']];
        }
        foreach ($locations as &$loc) {
            $loc['label']  = $labelMap[$loc['imei']]['label']  ?? $loc['imei'];
            $loc['kind']   = $labelMap[$loc['imei']]['kind']   ?? null;
            $loc['number'] = $labelMap[$loc['imei']]['number'] ?? null;
            if ($isTempHidden) {
                $loc['temperature'] = null;
            }
        }
        unset($loc);

        return response()->json(array_values($locations));
    }

    public function updateTrackingVisibility($id, Request $request)
    {
        $booking = Booking::findOrFail($id);

        $viasPending = Viaaddress::where('job_ref', $id)
            ->whereNull('deleted_at')
            ->where(function ($q) {
                $q->whereNull('signed_by')->orWhere('signed_by', '');
            })
            ->count();

        $podComplete = (int) ($booking->pod_data_verify ?? 0) === 1
            && strlen(trim((string) ($booking->pod_signature ?? ''))) > 0
            && strlen(trim((string) ($booking->pod_time ?? ''))) > 0;

        if ($podComplete && $viasPending === 0) {
            return response()->json([
                'success' => false,
                'locked' => true,
                'message' => 'Tracking is automatically hidden for completed jobs.',
            ]);
        }

        $booking->hide_tracking_temperature = $request->boolean('hide_tracking_temperature') ? 1 : 0;
        $booking->hide_tracking_map = $request->boolean('hide_tracking_map') ? 1 : 0;
        $booking->save();

        return response()->json([
            'success' => true,
            'hide_tracking_temperature' => (int) $booking->hide_tracking_temperature,
            'hide_tracking_map' => (int) $booking->hide_tracking_map,
        ]);
    }

    public function sendDriverNotification($booking, $driver = null, $seconMan = null, $cxdriver = null, $new = null)
    {
        if ($driver || $seconMan || $cxdriver) {
            if ($driver and ! $booking->driver and ! $new) {
                $driverId = $driver;
            } elseif ($seconMan and ! $booking->second_man and ! $new) {
                $driverId = $seconMan;
            } elseif ($cxdriver and ! $booking->cxdriver and ! $new) {
                $driverId = $cxdriver;
            }
            // new
            elseif ($driver and $booking->driver and $new) {
                $driverId = $driver;
            } elseif ($seconMan and $booking->second_man and $new) {
                $driverId = $seconMan;
            } elseif ($cxdriver and $booking->cxdriver and $new) {
                $driverId = $cxdriver;
            }

            if (isset($driverId) and Drivers::where('driver_id', $driverId)->count() > 0) {
                $driverInfo = Drivers::where('driver_id', $driverId)->first();
                if ($driverInfo->driver_email) {
                    $contact = $booking->driver_contact;
                    if ($contact and Driverscontact::where('id', $contact)->count() > 0) {
                        $contactName = Driverscontact::where('id', $contact)->first()->driver_name;
                    } else {
                        $contactName = $driverInfo->driver;
                    }
                    $details = [
                        'subject' => 'MP Transport LTD: Job Assigned to You',
                        'from' => config('mail.from.address'),
                        'greeting' => 'Hello '.$driverInfo->driver,
                        'body' => 'A new job has just been assign to you',
                        'itemCode' => 'Job Number: <a href="#">'.$booking->job_ref.'</a>',
                        'thanks' => 'Driver Contact: '.$contactName,
                        'actionText' => 'Login to your account',
                        'actionURL' => url('/'),
                    ];
                    Notification::route('mail', $driverInfo->driver_email)->notify(new AppNotification($details));
                }
            }
        }
    }

    /**
     * This method process booking edit form
     */
    public function update($id, Request $request)
    {
        $booking = Booking::findOrFail($id);

        if (strlen($request->input('manual_amount')) > 0) {
            $cost = $request->input('manual_amount');
        } else {
            $cost = $request->input('cost');
        }

        if ($request->input('avoid_tolls')) {
            $avoid_tolls = 1;
        } else {
            $avoid_tolls = 0;
        }
        /* GET MILEAGE INFO */
        if ($request->input('button') == 'Get Mileage and Costs') {
            $booking->collection_address1 = $request->input('collection_address1');
            $booking->collection_address2 = $request->input('collection_address2');
            $booking->collection_area = $request->input('collection_area');
            $booking->collection_country = $request->input('collection_country');
            $booking->collection_postcode = $request->input('collection_postcode');
            $booking->delivery_address1 = $request->input('delivery_address1');
            $booking->delivery_address2 = $request->input('delivery_address2');
            $booking->delivery_area = $request->input('delivery_area');
            $booking->delivery_country = $request->input('delivery_country');
            $booking->delivery_postcode = $request->input('delivery_postcode');
            $booking->manual_amount = $request->input('manual_amount');
            $booking->manual_desc = $request->input('manual_desc');
            $booking->avoid_tolls = $avoid_tolls;
            $booking->hide_tracking_temperature = $request->boolean('hide_tracking_temperature') ? 1 : 0;
            $booking->hide_tracking_map = $request->boolean('hide_tracking_map') ? 1 : 0;
            $booking->save();
            /* Process Via Addresses */
            for ($num = 1; $num <= 6; $num++) {
                $address1 = $request->input('address1-'.$num);
                if ($address1) {
                    foreach ($address1 as $key => $value) {
                        if ($value) {
                            if (Viaaddress::where('via_id', $request->input('id-'.$num))->count() > 0) {
                                Viaaddress::where('via_id', $request->input('id-'.$num))
                                    ->update([
                                        'via_type' => $request->input('via_type-'.$num)[$key],
                                        'job_ref' => $booking->job_ref,
                                        'name' => $request->input('name-'.$num)[$key],
                                        'address1' => $request->input('address1-'.$num)[$key],
                                        'address2' => $request->input('address2-'.$num)[$key],
                                        'area' => $request->input('area-'.$num)[$key],
                                        'country' => $request->input('country-'.$num)[$key],
                                        'postcode' => $request->input('postcode-'.$num)[$key],
                                        'phone' => $request->input('phone-'.$num)[$key],
                                        'contact' => $request->input('contact-'.$num)[$key],
                                        'notes' => $request->input('notes-'.$num)[$key],
                                        'via_date' => $this->dateYMD($request->input('via_date-'.$num)[$key]),
                                        'via_time' => $request->input('via_time-'.$num)[$key],
                                    ]);
                            } else {
                                Viaaddress::create([
                                    'user_id' => $this->createdFor(),
                                    'via_type' => $request->input('via_type-'.$num)[$key],
                                    'job_ref' => $booking->job_ref,
                                    'name' => $request->input('name-'.$num)[$key],
                                    'address1' => $request->input('address1-'.$num)[$key],
                                    'address2' => $request->input('address2-'.$num)[$key],
                                    'area' => $request->input('area-'.$num)[$key],
                                    'country' => $request->input('country-'.$num)[$key],
                                    'postcode' => $request->input('postcode-'.$num)[$key],
                                    'phone' => $request->input('phone-'.$num)[$key],
                                    'contact' => $request->input('contact-'.$num)[$key],
                                    'notes' => $request->input('notes-'.$num)[$key],
                                    'via_date' => $this->dateYMD($request->input('via_date-'.$num)[$key]),
                                    'via_time' => $request->input('via_time-'.$num)[$key],
                                ]);
                            }
                        }
                    }
                }
            }

            return redirect()->route('booking.edit', ['id' => $booking->job_ref, 'action' => 'adjust', 'cust' => $booking->customer])->with('success', 'Cost Updated Successfully.');
        } else {
            $validator = Validator::make($request->all(),
                [
                    'customer' => 'required',
                    'purchase_order' => 'required',
                    'weight' => 'required',
                    'number_of_items' => 'required',
                ]
            );

            // Fix #7: removed duplicate withInput() call
            if ($validator->fails()) {
                return back()->withInput()->withErrors($validator);
            } else {
                $chill = $request->input('chill_unit');
                $ambient = $request->input('ambient_unit');
                $driver = $request->input('driver');
                $seconMan = $request->input('second_man');
                $cxdriver = $request->input('cxdriver');
                $driver_contact = $request->input('driver_contact');

                if ($request->input('wait_and_return')) {
                    $wait = 1;
                } else {
                    $wait = 0;
                }
                if ($request->input('dead_mileage_status')) {
                    $dead_mileage = 1;
                } else {
                    $dead_mileage = 0;
                }

                /* Send driver a message if just attached */
                $this->sendDriverNotification($booking, $driver, $seconMan, $cxdriver);

                $booking->customer = $request->input('customer');
                $booking->customer_price = $request->input('customer_price');
                $booking->purchase_order = $request->input('purchase_order');
                $booking->miles = $request->input('miles');
                $booking->cost = $cost;
                $booking->time_covered = $request->input('time_covered');
                $booking->collection_date = $this->dateYMD($request->input('collection_date'));
                $booking->collection_time = $request->input('collection_time');
                $booking->collection_name = $request->input('collection_name');
                $booking->collection_address1 = $request->input('collection_address1');
                $booking->collection_address2 = $request->input('collection_address2');
                $booking->collection_area = $request->input('collection_area');
                $booking->collection_country = $request->input('collection_country');
                $booking->collection_postcode = $request->input('collection_postcode');
                $booking->collection_contact = $request->input('collection_contact');
                $booking->collection_phone = $request->input('collection_phone');
                $booking->collection_notes = $request->input('collection_notes');
                $booking->delivery_date = $this->dateYMD($request->input('delivery_date'));
                $booking->delivery_time = $request->input('delivery_time');
                $booking->delivery_name = $request->input('delivery_name');
                $booking->delivery_contact = $request->input('delivery_contact');
                $booking->delivery_address1 = $request->input('delivery_address1');
                $booking->delivery_address2 = $request->input('delivery_address2');
                $booking->delivery_area = $request->input('delivery_area');
                $booking->delivery_country = $request->input('delivery_country');
                $booking->delivery_postcode = $request->input('delivery_postcode');
                $booking->delivery_phone = $request->input('delivery_phone');
                $booking->delivery_notes = $request->input('delivery_notes');
                $booking->pod_signature = $request->input('pod_signature');
                $booking->pod_time = $request->input('pod_time');
                $booking->pod_date = $this->dateYMD($request->input('pod_date'));
                $booking->office_notes = $request->input('office_notes');
                $booking->vehicle = $request->input('vehicle');
                $booking->driver = $driver;
                $booking->driver_cost = $request->input('driver_cost');
                $booking->second_man = $seconMan;
                $booking->extra_cost = $request->input('extra_cost');
                $booking->extra_cost2 = $request->input('extra_cost2');
                $booking->cxdriver = $cxdriver;
                $booking->cxdriver_cost = $request->input('cxdriver_cost');
                $booking->updated_by = $this->createdFor();
                $booking->booked_by = $request->input('booked_by');
                $booking->number_of_items = $request->input('number_of_items');
                $booking->weight = $request->input('weight');
                $booking->booking_type = $request->input('booking_type');
                $booking->manual_amount = $request->input('manual_amount');
                $booking->manual_desc = $request->input('manual_desc');
                $booking->extra_cost2_label = $request->input('extra_cost2_label');
                $booking->job_notes = $request->input('job_notes');
                $booking->wait_and_return = $wait;
                $booking->dead_mileage_status = $dead_mileage;
                $booking->driver_contact = $request->input('driver_contact');
                $booking->avoid_tolls = $avoid_tolls;
                $booking->fuel_surcharge_percent = $request->input('fuel_surcharge_percent');
                $booking->fuel_surcharge_cost = $request->input('fuel_surcharge_cost');
                // Map submitted weekend value (1=Weekend, 3=Out of Hours, else=Normal) to DB value
                if ((int) $request->input('weekend') === 1) {
                    $booking->weekend = 1;
                } elseif ((int) $request->input('weekend') === 3) {
                    $booking->weekend = 2;
                } else {
                    $booking->weekend = 0;
                }
                $booking->hide_tracking_temperature = $request->boolean('hide_tracking_temperature') ? 1 : 0;
                $booking->hide_tracking_map = $request->boolean('hide_tracking_map') ? 1 : 0;
                if ($booking->unit_status == 1) {
                    $booking->chill_unit = $chill;
                    $booking->ambient_unit = $ambient;
                }
                $booking->delivered_temperature = $request->input('delivered_temperature');

                if ($driver_contact || $driver || $seconMan || $cxdriver) {
                    $currentDriver = $driver ?: ($driver_contact ?: ($seconMan ?: $cxdriver));

                    // Use saved booking unit IDs as fallback when unit dropdowns are hidden
                    $chillId = $chill ?: $booking->chill_unit;
                    if ($chillId) {
                        $chillInfo = Storages::where('id', $chillId)->where('availability', 'Yes');
                        if ($chillInfo->count()) {
                            $chillInfo->update(['current_driver' => $currentDriver, 'availability' => 'No', 'job_id' => $booking->job_ref, 'trackable' => 1]);
                            Storageusage::updateOrCreate(
                                ['job_id' => $booking->job_ref, 'unit_id' => $chillId],
                                ['unit_id' => $chillId, 'job_id' => $booking->job_ref, 'driver_id' => $currentDriver]
                            );
                        } else {
                            Storages::where('id', $chillId)->update(['trackable' => 1]);
                        }
                    }

                    $ambientId = $ambient ?: $booking->ambient_unit;
                    if ($ambientId) {
                        $ambientInfo = Storages::where('id', $ambientId)->where('availability', 'Yes');
                        if ($ambientInfo->count()) {
                            $ambientInfo->update(['current_driver' => $currentDriver, 'availability' => 'No', 'job_id' => $booking->job_ref, 'trackable' => 1]);
                            Storageusage::updateOrCreate(
                                ['job_id' => $booking->job_ref, 'unit_id' => $ambientId],
                                ['unit_id' => $ambientId, 'job_id' => $booking->job_ref, 'driver_id' => $currentDriver]
                            );
                        } else {
                            Storages::where('id', $ambientId)->update(['trackable' => 1]);
                        }
                    }
                }

                // Auto-disable alerts when full POD is complete.
                // Uses the booking record's own data (not request) so it works
                // even when the unit dropdowns are not visible on the form.
                $bookingChillUnit   = $booking->chill_unit;
                $bookingAmbientUnit = $booking->ambient_unit;

                $podComplete = $booking->pod_data_verify == 1
                    && strlen($booking->pod_signature ?? '') > 1
                    && strlen($booking->pod_time ?? '') > 1;

                if ($podComplete && ($bookingChillUnit || $bookingAmbientUnit)) {
                    $viasPending = Viaaddress::where('job_ref', $booking->job_ref)
                        ->where(function ($q) {
                            $q->whereNull('signed_by')->orWhere('signed_by', '');
                        })
                        ->count();

                    if ($viasPending === 0) {
                        if ($bookingChillUnit)   Storages::where('id', $bookingChillUnit)->update(['trackable' => 0]);
                        if ($bookingAmbientUnit) Storages::where('id', $bookingAmbientUnit)->update(['trackable' => 0]);
                    }
                }

                if (strlen($request->input('pod_signature')) < 1 && strlen($request->input('pod_time')) < 1 && $booking->job_status == 1) {
                    $booking->job_status = 0;
                    $booking->invoice_number = 0;
                }

                /* Logic for multiple upload */
                if ($request->hasFile('filename')) {
                    $rules = [];
                    $filez = count($request->file('filename'));
                    foreach (range(0, $filez) as $index) {
                        $rules['filename.'.$index] = $this->mixedRules();
                    }
                    $valFile = Validator::make($request->all(), $rules);
                    if ($valFile->fails()) {
                        return response()->json(['error' => true, 'message' => $valFile->errors()->all()]);
                    } else {
                        $filekey = $request->file('filename');
                        $this->multipleupload($filekey, $booking->job_ref, 'booking', 'mixed');
                    }
                }

                if ($request->input('copy') === 'Copy and Create New Job') {
                    $data = [
                        'user_id' => $this->createdFor(),
                        'customer' => $request->input('customer'),
                        'purchase_order' => $request->input('purchase_order'),
                        'miles' => $request->input('miles'),
                        'cost' => $cost,
                        'time_covered' => $request->input('time_covered'),
                        'collection_date' => $this->dateYMD($request->input('collectionDate')),
                        'collection_name' => $request->input('collection_name'),
                        'collection_address1' => $request->input('collection_address1'),
                        'collection_address2' => $request->input('collection_address2'),
                        'collection_area' => $request->input('collection_area'),
                        'collection_country' => $request->input('collection_country'),
                        'collection_postcode' => $request->input('collection_postcode'),
                        'collection_contact' => $request->input('collection_contact'),
                        'collection_phone' => $request->input('collection_phone'),
                        'delivery_date' => $this->dateYMD($request->input('deliveryDate')),
                        'delivery_name' => $request->input('delivery_name'),
                        'delivery_address1' => $request->input('delivery_address1'),
                        'delivery_address2' => $request->input('delivery_address2'),
                        'delivery_area' => $request->input('delivery_area'),
                        'delivery_country' => $request->input('delivery_country'),
                        'delivery_postcode' => $request->input('delivery_postcode'),
                        'delivery_contact' => $request->input('delivery_contact'),
                        'delivery_phone' => $request->input('delivery_phone'),
                        'delivery_notes' => $request->input('delivery_notes'),
                        'avoid_tolls' => $avoid_tolls,
                        'pod_date' => $this->dateYMD($request->input('deliveryDate')),
                        'vehicle' => $request->input('vehicle'),
                        'created_by' => $this->memberId(),
                        'updated_by' => $this->memberId(),
                        'booked_by' => $request->input('booked_by'),
                        'number_of_items' => $request->input('number_of_items'),
                        'weight' => $request->input('weight'),
                        'booking_type' => $request->input('booking_type'),
                        'extra_cost2_label' => $request->input('extra_cost2_label'),
                        'wait_and_return' => $wait,
                        'dead_mileage_status' => $dead_mileage,
                        'weekend' => $booking->weekend,
                    ];
                    $data = Booking::create($data);
                    $bookingId = $data->job_ref;
                    $vias = Viaaddress::where('job_ref', $booking->job_ref);
                    if ($vias->count() > 0) {
                        foreach ($vias->get() as $via) {
                            Viaaddress::create(
                                [
                                    'via_type' => $via->via_type,
                                    'job_ref' => $bookingId,
                                    'name' => $via->name,
                                    'address1' => $via->address1,
                                    'address2' => $via->address2,
                                    'area' => $via->area,
                                    'country' => $via->country,
                                    'postcode' => $via->postcode,
                                    'phone' => $via->phone,
                                    'contact' => $via->contact,
                                    'notes' => $via->notes,
                                    'via_date' => Carbon::now()->format('Y-m-d'),
                                    'via_time' => Carbon::now()->format('H:i:s'),
                                ]
                            );
                        }
                    }
                } else {
                    $booking->save();
                    $bookingId = $booking->job_ref;
                }

                if ($request->input('copy') !== 'Copy and Create New Job') {
                    /* Save address */
                    Viaaddress::firstOrCreate(
                        ['name' => $request->input('collection_name')],
                        [
                            'user_id' => $this->createdFor(),
                            'job_ref' => '',
                            'via_type' => 'Collection',
                            'name' => $request->input('collection_name'),
                            'address1' => $request->input('collection_address1'),
                            'address2' => $request->input('collection_address2'),
                            'area' => $request->input('collection_area'),
                            'country' => $request->input('collection_country'),
                            'postcode' => $request->input('collection_postcode'),
                            'notes' => $request->input('collection_notes'),
                            'contact' => $request->input('collection_contact'),
                            'phone' => $request->input('collection_phone'),
                        ]
                    );
                    Viaaddress::firstOrCreate(
                        ['name' => $request->input('delivery_name')],
                        [
                            'user_id' => $this->createdFor(),
                            'job_ref' => '',
                            'via_type' => 'Delivery',
                            'name' => $request->input('delivery_name'),
                            'address1' => $request->input('delivery_address1'),
                            'address2' => $request->input('delivery_address2'),
                            'area' => $request->input('delivery_area'),
                            'country' => $request->input('delivery_country'),
                            // Fix: was using 'delivery_postcodes' (typo with extra 's') in original
                            'postcode' => $request->input('delivery_postcode'),
                            'notes' => $request->input('delivery_notes'),
                            'contact' => $request->input('delivery_contact'),
                            'phone' => $request->input('delivery_phone'),
                        ]
                    );
                    /* Process Via Addresses */
                    for ($num = 1; $num <= 6; $num++) {
                        $address1 = $request->input('address1-'.$num);
                        if ($address1) {
                            foreach ($address1 as $key => $value) {
                                $name = $request->input('name-'.$num)[$key];
                                if ($value) {
                                    if (Viaaddress::where('via_id', $request->input('id-'.$num))->count() > 0 and $request->input('copy') != 'Copy and Create New Job') {
                                        Viaaddress::where('via_id', $request->input('id-'.$num))
                                            ->update([
                                                'via_type' => $request->input('via_type-'.$num)[$key],
                                                'job_ref' => $bookingId,
                                                'name' => $request->input('name-'.$num)[$key],
                                                'address1' => $request->input('address1-'.$num)[$key],
                                                'address2' => $request->input('address2-'.$num)[$key],
                                                'area' => $request->input('area-'.$num)[$key],
                                                'country' => $request->input('country-'.$num)[$key],
                                                'postcode' => $request->input('postcode-'.$num)[$key],
                                                'phone' => $request->input('phone-'.$num)[$key],
                                                'contact' => $request->input('contact-'.$num)[$key],
                                                'notes' => $request->input('notes-'.$num)[$key],
                                                'signed_by' => $request->input('signed_by-'.$num)[$key],
                                                'date' => $this->dateYMD($request->input('pod_date-'.$num)[$key]),
                                                'time' => $request->input('pod_time-'.$num)[$key],
                                                'via_date' => $this->dateYMD($request->input('via_date-'.$num)[$key]),
                                                'via_time' => $request->input('via_time-'.$num)[$key],
                                                'delivered_temperature' => $request->input('delivered_temperature-'.$num)[$key],
                                            ]);
                                    } else {
                                        Viaaddress::create(
                                            [
                                                'via_type' => $request->input('via_type-'.$num)[$key],
                                                'job_ref' => $bookingId,
                                                'name' => $request->input('name-'.$num)[$key],
                                                'address1' => $request->input('address1-'.$num)[$key],
                                                'address2' => $request->input('address2-'.$num)[$key],
                                                'area' => $request->input('area-'.$num)[$key],
                                                'country' => $request->input('country-'.$num)[$key],
                                                'postcode' => $request->input('postcode-'.$num)[$key],
                                                'phone' => $request->input('phone-'.$num)[$key],
                                                'contact' => $request->input('contact-'.$num)[$key],
                                                'notes' => $request->input('notes-'.$num)[$key],
                                                'signed_by' => $request->input('signed_by-'.$num)[$key],
                                                'date' => $this->dateYMD($request->input('pod_date-'.$num)[$key]),
                                                'time' => $request->input('pod_time-'.$num)[$key],
                                                'via_date' => $this->dateYMD($request->input('via_date-'.$num)[$key]),
                                                'via_time' => $request->input('via_time-'.$num)[$key],
                                                'delivered_temperature' => $request->input('delivered_temperature-'.$num)[$key],
                                            ]
                                        );
                                        if (Viaaddress::where('job_ref', $bookingId)->where('name', $name)->whereNotNull('deleted_at')->count()) {
                                            Viaaddress::where('job_ref', $bookingId)->where('name', $name)->whereNotNull('deleted_at')->delete();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Collected Orders MAIN
                if ($request->input('orders')) {
                    $orders = $request->input('orders');
                    // Fix #6: removed unused $type variable
                    foreach ($orders as $order) {
                        $order_number = $order['collected_orders'] ?? '';
                        $ambience = $order['collected_ambience'] ?? 0;
                        $chill = $order['collected_chill'] ?? 0;
                        $pump = $order['collected_pump'] ?? 0;
                        $stores = $order['collected_stores'] ?? 0;
                        $orderId = $order['orderId'] ?? 0;
                        if ($order_number) {
                            CollectedOrders::updateOrCreate(
                                ['id' => $orderId],
                                [
                                    'booking_id' => $bookingId,
                                    'type' => 'main',
                                    'order_number' => $order_number,
                                    'ambience' => $ambience,
                                    'chill' => $chill,
                                    'pump' => $pump,
                                    'stores' => $stores,
                                ]
                            );
                        }
                    }
                }

                // Collected Orders VIAS
                for ($num = 1; $num <= 6; $num++) {
                    if ($request->input('orders'.$num)) {
                        $orders2 = $request->input('orders'.$num);
                        foreach ($orders2 as $order) {
                            $order_number2 = $order['collected_orders'.$num] ?? '';
                            $ambience2 = $order['collected_ambience'.$num] ?? 0;
                            $chill2 = $order['collected_chill'.$num] ?? 0;
                            $pump2 = $order['collected_pump'.$num] ?? 0;
                            $stores2 = $order['collected_stores'.$num] ?? 0;
                            $viaId = $order['viaId'] ?? 0;
                            $orderId = $order['orderId'] ?? 0;

                            if ($order_number2) {
                                CollectedOrders::updateOrCreate(
                                    [
                                        'id' => $orderId,
                                        'type' => 'via',
                                        'via' => $viaId,
                                    ],
                                    [
                                        'booking_id' => $bookingId,
                                        'type' => 'via',
                                        'via' => $viaId,
                                        'order_number' => $order_number2,
                                        'ambience' => $ambience2,
                                        'chill' => $chill2,
                                        'pump' => $pump2,
                                        'stores' => $stores2,
                                    ]
                                );
                            }
                        }
                    }
                }

                $this->createGeocode($booking->job_ref);
                $this->addLog('Updated Job '.$booking->job_ref, $bookingId);

                return back()->withInput()->with('success', 'Record Updated Successfully.');
            }
        }
    }

    /**
     * This method delete record from database
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        if ($request->ajax()) {
            Viaaddress::where('job_ref', $id)->update(['deleted_at' => Carbon::now()]);
            Booking::findOrFail($id)->delete();
            $this->addLog('Deleted Job', $id);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * This method delete file associated with a record.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyFile(Request $request, $id)
    {
        if ($request->ajax()) {
            $booking = Booking::findOrFail($id);
            $this->deleteFile('uploads/'.$booking->pod_upload);

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * This method handle file delete from related table which were uploaded using the multiple upload option.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyFile2(Request $request, $id)
    {
        $this->deleteFileWith($id);

        return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
    }

    /**
     * Delete with checkbox
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Booking::where('job_ref', $id)->delete();
                // Fix #8: addLog called consistently with job ref as second argument
                $this->addLog('Deleted Job', $id);
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * @param  null  $fromdate
     * @param  null  $todate
     * @param  null  $user
     * @return mixed
     */
    public function exportPrint($user = null, $fromdate = null, $todate = null, $customer = null, $driverId = null, $archive = null)
    {
        if (Auth::user()->hasRole('driver')) {
            $driver = Auth::user()->driverId;
        } else {
            $driver = $driverId;
        }
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, 2);
        if ($customer) {
            $customerName = Customers::where('customer_id', $customer)->first()->customer;
        } else {
            $customerName = '';
        }
        if ($driver) {
            $driverName = Drivers::where('driver_id', $driver)->first()->driver;
        } else {
            $driverName = '';
        }
        if ($fromdate and $todate) {
            $dateFrom = Carbon::parse($fromdate, config('timezone'))->format('dS M Y');
            $dateTo = Carbon::parse($todate, config('timezone'))->format('dS M Y');
        } else {
            $dateFrom = '';
            $dateTo = '';
        }
        if (Auth::user()->hasRole('driver')) {
            return view('driverAccess.print', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
        } else {
            return view('admin.booking.print', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
        }
    }

    /**
     * @param  null  $fromdate
     * @param  null  $todate
     * @param  null  $user
     * @return mixed
     */
    public function exportPostcodeSum($user = null, $fromdate = null, $todate = null, $customer = null, $driverId = null, $archive = null)
    {
        if (Auth::user()->hasRole('driver')) {
            $driver = Auth::user()->driverId;
        } else {
            $driver = $driverId;
        }
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, $archive);
        if ($customer) {
            $customerName = Customers::where('customer_id', $customer)->first()->customer;
        } else {
            $customerName = '';
        }
        if ($driver) {
            $driverName = Drivers::where('driver_id', $driver)->first()->driver;
        } else {
            $driverName = '';
        }
        if ($fromdate and $todate) {
            $dateFrom = Carbon::parse($fromdate, config('timezone'))->format('dS M Y');
            $dateTo = Carbon::parse($todate, config('timezone'))->format('dS M Y');
        } else {
            $dateFrom = '';
            $dateTo = '';
        }
        if (\request()->input('state')) {
            $paymentsArray = [];
            $paymentsArray[] = ['Job Ref', 'Postcode Total'];
            foreach ($booking as $book) {
                $viaSum = Viaaddress::where('job_ref', $book->job_ref)->count() + 2;
                $paymentsArray[] = [$book->customerId.'-'.$book->job_ref, $viaSum];
            }

            return (new CustomExports([$paymentsArray]))->download('BPostcodeSum_'.rand(1, 9999).'.csv');
        } else {
            return view('admin.booking.postcode-sum', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
        }
    }

    /**
     * @param  null  $fromdate
     * @param  null  $todate
     * @param  null  $user
     * @return mixed
     */
    public function exportPostcode($user = null, $fromdate = null, $todate = null, $customer = null, $driverId = null, $archive = null)
    {
        if (Auth::user()->hasRole('driver')) {
            $driver = Auth::user()->driverId;
        } else {
            $driver = $driverId;
        }
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, $archive);
        if ($customer) {
            $customerName = Customers::where('customer_id', $customer)->first()->customer;
        } else {
            $customerName = '';
        }
        if ($driver) {
            $driverName = Drivers::where('driver_id', $driver)->first()->driver;
        } else {
            $driverName = '';
        }
        if ($fromdate and $todate) {
            $dateFrom = Carbon::parse($fromdate, config('timezone'))->format('dS M Y');
            $dateTo = Carbon::parse($todate, config('timezone'))->format('dS M Y');
        } else {
            $dateFrom = '';
            $dateTo = '';
        }
        if (\request()->input('state')) {
            $paymentsArray = [];
            $paymentsArray[] = ['Job Ref', 'Postcodes', 'Miles', 'Date', 'Vehicle', 'Extra Cost Information', 'Total'];
            foreach ($booking as $book) {
                $allVials = '';
                $vias = Viaaddress::where('job_ref', $book->job_ref)->orderBy('via_id')->get();
                if (count($vias)) {
                    foreach ($vias as $col) {
                        if ($col->postcode) {
                            $allVials .= ', '.$col->postcode;
                        }
                    }
                }
                $newPostcodes = $book->collection_postcode.', '.$book->delivery_postcode.$allVials;
                $total = number_format(($book->cost + $book->extra_cost2), 2);
                $paymentsArray[] = [$book->customerId.'-'.$book->job_ref, $newPostcodes, $book->miles, $book->delivery_date, $book->vehicleName, $book->manual_desc, $total];
            }

            return (new CustomExports([$paymentsArray]))->download('BPostcodeInfo_'.rand(1, 9999).'.csv');
        } else {
            return view('admin.booking.postcode', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
        }
    }

    /**
     * Export to PDF
     *
     * @param  null  $user
     * @param  null  $fromdate
     * @param  null  $todate
     * @param  null  $customer
     * @param  null  $driverId
     * @param  null  $archive
     * @return mixed
     */
    public function exportPDF($user = null, $fromdate = null, $todate = null, $customer = null, $driverId = null, $archive = null)
    {
        if (Auth::user()->hasRole('driver')) {
            $driver = Auth::user()->driverId;
        } else {
            $driver = $driverId;
        }
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, 2);
        if ($customer) {
            $customerName = Customers::where('customer_id', $customer)->first()->customer;
        } else {
            $customerName = '';
        }
        if ($driver) {
            $driverName = Drivers::where('driver_id', $driver)->first()->driver;
        } else {
            $driverName = '';
        }
        if ($fromdate and $todate) {
            $dateFrom = Carbon::parse($fromdate, config('timezone'))->format('dS M Y');
            $dateTo = Carbon::parse($todate, config('timezone'))->format('dS M Y');
        } else {
            $dateFrom = '';
            $dateTo = '';
        }
        // Fix #2: using updated Pdf facade (Barryvdh\DomPDF\Facade\Pdf)
        if (Auth::user()->hasRole('driver')) {
            $pdf = Pdf::loadView('driverAccess.print', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
            $pdf->setPaper('A4');
        } else {
            $pdf = Pdf::loadView('admin.booking.print', compact('booking', 'customerName', 'driverName', 'dateFrom', 'dateTo'));
            $pdf->setPaper([0, 0, 1883.78, 2583.94], 'landscape');
        }
        $pdf->getDomPDF()->set_option('enable_php', true);

        return $pdf->download('booking_'.Str::random(5).'.pdf');
    }

    /**
     * Export driver statement to PDF
     *
     * @return mixed
     */
    public function exportDriver($user = null, $fromdate = null, $todate = null, $customer = null, $driver = null, $archive = null)
    {
        Artisan::call('view:clear');
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, $archive);
        $user = $this->createdFor();
        $userinfo = Usersettings::where('user_id', $user)->first();
        if ($customer) {
            $customerName = Customers::where('customer_id', $customer)->first()->customer;
        } else {
            $customerName = '';
        }
        if ($driver) {
            $driverName = Drivers::where('driver_id', $driver)->first()->driver;
            $driverInfo = Drivers::where('driver_id', $driver)->first();
        } else {
            $driverName = '';
            $driverInfo = null;
        }
        if ($fromdate and $todate) {
            $dateFrom = Carbon::parse($fromdate, config('timezone'))->format('dS M Y');
            $dateTo = Carbon::parse($todate, config('timezone'))->format('dS M Y');
        } else {
            $dateFrom = '';
            $dateTo = '';
        }
        // Fix #2: using updated Pdf facade
        $pdf = Pdf::loadView('admin.booking.driver', compact('booking', 'userinfo', 'customerName', 'driverName', 'dateFrom', 'dateTo', 'driverInfo'));

        return $pdf->stream('driver_statement.pdf');
    }

    public function exportDetailPDF($id)
    {
        $booking = Booking::LeftJoin('customers', 'customers.customer_id', '=', 'booking.customer')
            ->LeftJoin('user_settings', 'user_settings.user_id', '=', 'booking.user_id')
            ->LeftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
            ->LeftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
            ->LeftJoin('drivers as drivers_1', 'drivers_1.driver_id', '=', 'booking.second_man')
            ->select('booking.*', 'customers.customer', 'customers.account_number as customerId',
                'user_settings.upload_logo', 'vehicles.name as vehicleName',
                'drivers.driver as driverName', 'drivers.driver_email', 'drivers.driver_phone',
                'drivers_1.driver as driverName', 'drivers_1.driver_email', 'drivers_1.driver_phone')
            ->where('job_ref', $id)->first();
        if (CollectedOrders::where('booking_id', $id)->count()) {
            $collectedOrders = CollectedOrders::where('booking_id', $id)->get();
        } else {
            $collectedOrders = [];
        }
        $driver = Drivers::where('driver_id', $booking->driver)->orWhere('driver_id', $booking->second_man)->first();
        $viaAddresses = Viaaddress::where('job_ref', $id)->whereNull('deleted_at')->orderBy('via_id')->get();
        // Fix #2: using updated Pdf facade
        $pdf = Pdf::loadView('admin.booking.print-details', compact('booking', 'viaAddresses', 'driver', 'collectedOrders'));
        $pdf->setPaper([0, 0, 620.78, 950.94], 'portrait');

        return $pdf->download('booking_'.$booking->job_ref.'.pdf');
    }

    /*
     * Send Email to Driver
     */
    public function sendJobToMail(Request $request)
    {
        $jobRef = $request->input('job_ref');
        $email = $request->input('driver_email');
        if ($jobRef and $email) {
            Mail::to($email)->queue(new MailJob($jobRef));
            $this->addLog('Job '.$jobRef.' email to '.$email, $jobRef);

            return response()->json(['success' => true, 'message' => 'Job '.$jobRef.' has been sent to driver email '.$email]);
        } else {
            return response()->json(['success' => true, 'message' => 'Oops Something is not right!']);
        }
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.booking.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('booking_file')) {
            $path = $request->file('booking_file')->getRealPath();
            Excel::import(new BookingImports, $path);

            return response()->json(['success' => true, 'message' => trans('app.import.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.import.error')]);
    }

    /**
     * Export to csv and excel
     *
     * @param  null  $user
     * @param  null  $fromdate
     * @param  null  $todate
     */
    public function exportFile($type, $user = null, $fromdate = null, $todate = null, $customer = null, $driver = null, $archive = null)
    {
        $booking = $this->queries($fromdate, $todate, $user, $customer, $driver, 0);
        $paymentsArray = [];
        $paymentsArray[] = ['job_ref', 'user', 'customer', 'purchase_order', 'miles', 'collection_date', 'collection_time', 'collection_name', 'collection_address1', 'collection_address2', 'collection_area', 'collection_country', 'collection_postcode', 'collection_notes', 'delivery_date', 'delivery_time', 'delivery_name', 'delivery_address1', 'delivery_address2', 'delivery_area', 'delivery_country', 'delivery_postcode', 'delivery_notes', 'pod_signature', 'pod_time', 'invoice_number', 'office_notes', 'vehicle', 'driver', 'second_man', 'customer_price', 'driver_cost', 'extra_cost', 'created_by'];
        foreach ($booking as $payment) {
            $paymentsArray[] = [$payment->job_ref, $payment->username, $payment->customer, $payment->purchase_order, $payment->miles, $payment->collection_date, $payment->collection_time, $payment->collection_name, $payment->collection_address1, $payment->collection_address2, $payment->collection_area, $payment->collection_country, $payment->collection_postcode, $payment->collection_notes, $payment->delivery_date, $payment->delivery_time, $payment->delivery_name, $payment->delivery_address1, $payment->delivery_address2, $payment->delivery_area, $payment->delivery_country, $payment->delivery_postcode, $payment->delivery_notes, $payment->pod_signature, $payment->pod_time, $payment->invoice_number, $payment->office_notes, $payment->vehicleName, $payment->driverName, $payment->secondMan, $payment->cost, $payment->driver_cost, $payment->extra_cost, $payment->createdBy];
        }

        return (new CustomExports([$paymentsArray]))->download('bookings_'.rand(1, 9999).'.'.$type);
    }

    public function similarJobs(Request $request)
    {
        $address1  = $request->input('address1');
        $address2  = $request->input('address2');
        $customer  = $request->input('customer');
        $vehicleId = $request->input('vehicle');

        if ($address1 or $address2) {
            $query = Booking::leftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->select('booking.*', 'vehicles.name as vehicleName')
                ->where('booking.customer', $customer)
                ->where('booking.collection_postcode', $address1)
                ->where('booking.delivery_postcode', $address2);

            // Filter by the same vehicle so only truly similar jobs appear
            if ($vehicleId) {
                $query->where('booking.vehicle', $vehicleId);
            }

            if ($request->input('jobId')) {
                $query->where('booking.job_ref', '!=', $request->input('jobId'));
            }

            $bookings = $query->limit(50)->get();

            $html = '<table class="table table-sm table-light">
                        <thead><tr>
                            <th scope="col">Job</th>
                            <th scope="col">Date</th>
                            <th scope="col">Vehicle</th>
                            <th scope="col">Miles</th>
                            <th scope="col">Quote</th>
                        </tr></thead><tbody>';

            foreach ($bookings as $booked) {
                $html .= '<tr>
                            <td><a href="'.route('booking.edit', ['id' => $booked->job_ref]).'" target="_blank">Job-'.$booked->job_ref.'</a></td>
                            <td>'.Carbon::parse($booked->created_at, config('timezone'))->format('d-m-Y').'</td>
                            <td>'.e($booked->vehicleName ?: '—').'</td>
                            <td>'.$booked->miles.'</td>
                            <td>'.config('booking.currency_symbol').$booked->cost.'</td>
                          </tr>';
            }

            $html .= '</tbody></table>';
            echo $html;
        } else {
            echo '';
        }
    }

    public function customerRates(Request $request)
    {
        $id = $request->input('cust');
        $weekend = $request->input('weekend');
        if ($request->input('edit')) {
            $label = 'Change Vehicle';
        } else {
            $label = 'Select/Change Vehicle';
        }
        $rates = Customervehiclerates::LeftJoin('vehicles', 'vehicles.id', '=', 'customer_vehicle_rates.vehicle_id')
            ->LeftJoin('customers', 'customers.customer_id', '=', 'customer_vehicle_rates.customer_id')
            ->select('vehicles.name', 'vehicles.id', 'customer_vehicle_rates.rate_per_mile', 'customer_vehicle_rates.rate_per_mile_weekends', 'customer_vehicle_rates.rate_per_mile_out_of_hours')
            ->where('customers.customer_id', $id)
            ->orderBy('vehicles.name', 'asc')
            ->get();
        $html = '';
        if ($rates) {
            $html .= '<script></script>';
            $html .= '<select name="vehicleCost" id="vehicleCost" class="form-control styler">
                              <option value="">'.$label.'</option>';
            foreach ($rates as $rate) {
                if ($weekend == 1) {
                    if ($rate->rate_per_mile_weekends) {
                        $html .= '<option value="'.$rate->rate_per_mile_weekends.'|'.$rate->id.'|'.$rate->name.'">'.$rate->name.' = '.$rate->rate_per_mile_weekends.'/mile</option>';
                    }
                } elseif ($weekend == 3) {
                    if ($rate->rate_per_mile_out_of_hours) {
                        $html .= '<option value="'.$rate->rate_per_mile_out_of_hours.'|'.$rate->id.'|'.$rate->name.'">'.$rate->name.' = '.$rate->rate_per_mile_out_of_hours.'/mile</option>';
                    }
                } else {
                    if ($rate->rate_per_mile) {
                        $html .= '<option value="'.$rate->rate_per_mile.'|'.$rate->id.'|'.$rate->name.'">'.$rate->name.' = '.$rate->rate_per_mile.'/mile</option>';
                    }
                }
            }

            $html .= '</select> ';
            echo $html;
        } else {
            echo '';
        }
    }

    public function customSearch(Request $request)
    {
        $search = $request->input('search');
        if ($search) {
            $bookings1 = DB::table('booking')
                ->crossJoin('via_address', 'booking.job_ref', '=', 'via_address.job_ref')
                ->select('booking.*', 'via_address.postcode')
                ->where('via_address.postcode', 'like', '%'.$search.'%')
                ->groupBy('booking.job_ref')
                ->orderBy('booking.job_ref', 'desc')
                ->limit(30)
                ->get();

            $bookings2 = DB::table('booking')
                ->crossJoin('customers', 'customers.customer_id', '=', 'booking.customer')
                ->leftJoin('drivers', 'drivers.driver_id', '=', 'booking.driver')
                ->leftJoin('drivers as subcon', 'subcon.driver_id', '=', 'booking.second_man')
                ->leftJoin('vehicles', 'vehicles.id', '=', 'booking.vehicle')
                ->select('booking.*')
                ->where('booking.collection_postcode', 'like', '%'.$search.'%')
                ->orWhere('booking.delivery_postcode', 'like', '%'.$search.'%')
                ->orWhere('booking.job_ref', 'like', '%'.$search.'%')
                ->orWhere('booking.job_notes', 'like', '%'.$search.'%')
                ->orWhere('customers.customer', 'like', '%'.$search.'%')
                ->orWhere('drivers.driver', 'like', '%'.$search.'%')
                ->orWhere('vehicles.name', 'like', '%'.$search.'%')
                ->groupBy('booking.job_ref')
                ->orderBy('booking.job_ref', 'desc')
                ->limit(30)
                ->get();

            $merged = $bookings2->merge($bookings1);
            $bookings = $merged->unique();

            $html = '<table class="table table-sm table-light" style="font-size: 12px">
                                <thead>
                                <tr>
                                    <th scope="col">Job Ref</th>
                                    <th scope="col">Date</th>
                                    <th scope="col">Collect</th>
                                    <th scope="col">Via 1</th>
                                    <th scope="col">Via 2</th>
                                    <th scope="col">Via 3</th>
                                    <th scope="col">Delivery</th>
                                </tr>
                                </thead>
                                <tbody>';
            foreach ($bookings as $booked) {
                $via = Viaaddress::select('postcode', 'signed_by')->where('job_ref', $booked->job_ref)->whereNull('deleted_at');
                $via1 = '';
                $via2 = '';
                $via3 = '';
                if ($via->count() > 0) {
                    $newme = $via->pluck('postcode');
                    $via1 .= $newme[0];
                    if (isset($newme[1])) {
                        $via2 .= $newme[1];
                    }
                    if (isset($newme[2])) {
                        $via3 .= $newme[2];
                    }
                }
                $html .= '<tr>
                                            <td><a href="'.route('booking.edit', ['id' => $booked->job_ref]).'" class="btn btn-outline-success btn-sm">Job-'.$booked->job_ref.'</a></td>
                                            <td>'.Carbon::parse($booked->collection_date, config('timezone'))->format('d/m/Y').'</td>
                                            <td>'.$booked->collection_postcode.'</td>
                                            <td>'.$via1.'</td>
                                            <td>'.$via2.'</td>
                                            <td>'.$via3.'</td>
                                            <td>'.$booked->delivery_postcode.'</td>
                                        </tr>';
            }
            $html .= '</tbody>
                            </table>';
            if (count($bookings) > 0) {
                return response()->json(['success' => true, 'message' => $html]);
            } else {
                return response()->json(['error' => true, 'message' => 'No search result found.']);
            }
        } else {
            return response()->json(['error' => true, 'message' => 'No search result found.']);
        }
    }

    /*
     * POD Status
     */
    public function PODStatus($id)
    {
        $booked = Booking::findOrFail($id);

        if ($booked->pod == 0) {
            $booked->pod = 1;
            $booked->pod_data_verify = 1;
        } else {
            $booked->pod = 0;
        }
        $booked->save();

        return back()->with('success', 'Job '.$booked->job_ref.' POD has been updated!');
    }

    /**
     * Heartbeat — called every 30s by the edit page to keep the lock alive.
     */
    public function editHeartbeat($id)
    {
        $userId = Auth::user()->id;

        $otherLock = Jobaccess::where('job_id', $id)
            ->where('user_id', '!=', $userId)
            ->where('access', 1)
            ->first();

        if ($otherLock) {
            return response()->json([
                'ok' => false,
                'locked' => true,
                'redirect' => $this->bookingTableTodayUrl(),
            ], 423);
        }

        Jobaccess::updateOrCreate(
            ['job_id' => $id, 'user_id' => $userId],
            ['job_id' => $id, 'user_id' => $userId, 'access' => 1]
        );

        $pending = Jobaccess::where('job_id', $id)
            ->where('user_id', '!=', $userId)
            ->where('access', 0)
            ->where('isRequest', 1)
            ->orderByDesc('updated_at')
            ->first();

        if (! $pending) {
            return response()->json(['ok' => true, 'pending' => null]);
        }

        $requester = \App\User::find($pending->user_id);

        return response()->json([
            'ok' => true,
            'pending' => [
                'id' => $pending->id,
                'user_id' => $pending->user_id,
                'name' => $requester ? $requester->name : ('User #'.$pending->user_id),
            ],
        ]);
    }

    /**
     * Poll pending access requests for the currently active editor.
     */
    public function pendingAccessRequest($id)
    {
        $userId = Auth::user()->id;

        $activeLock = Jobaccess::where('job_id', $id)
            ->where('access', 1)
            ->orderByDesc('updated_at')
            ->first();

        if (! $activeLock || (int) $activeLock->user_id !== (int) $userId) {
            return response()->json([
                'ok' => true,
                'forced_out' => true,
                'redirect' => $this->bookingTableTodayUrl(),
            ]);
        }

        $pending = Jobaccess::where('job_id', $id)
            ->where('user_id', '!=', $userId)
            ->where('access', 0)
            ->where('isRequest', 1)
            ->orderByDesc('updated_at')
            ->first();

        if (! $pending) {
            return response()->json(['ok' => true, 'pending' => null]);
        }

        $requester = \App\User::find($pending->user_id);

        return response()->json([
            'ok' => true,
            'pending' => [
                'id' => $pending->id,
                'user_id' => $pending->user_id,
                'name' => $requester ? $requester->name : ('User #'.$pending->user_id),
            ],
        ]);
    }

    /**
     * Allow or decline a pending access request from the current editor.
     */
    public function respondAccessRequest($id, $requestId, Request $request)
    {
        $userId = Auth::user()->id;
        $action = $request->input('action');

        $activeLock = Jobaccess::where('job_id', $id)
            ->where('access', 1)
            ->orderByDesc('updated_at')
            ->first();

        if (! $activeLock || (int) $activeLock->user_id !== (int) $userId) {
            return response()->json(['ok' => false, 'message' => 'You no longer hold this job lock.'], 403);
        }

        $pending = Jobaccess::where('id', $requestId)
            ->where('job_id', $id)
            ->where('access', 0)
            ->where('isRequest', 1)
            ->first();

        if (! $pending) {
            return response()->json(['ok' => false, 'message' => 'Request no longer pending.'], 404);
        }

        if ($action === 'allow') {
            Jobaccess::where('job_id', $id)->update(['access' => 0]);
            Jobaccess::where('id', $pending->id)->update(['access' => 1, 'isRequest' => 2]);

            return response()->json([
                'ok' => true,
                'message' => 'Access granted. Returning to booking list.',
                'redirect_editor' => $this->bookingTableTodayUrl(),
            ]);
        }

        if ($action === 'decline') {
            Jobaccess::where('id', $pending->id)->update(['access' => 0, 'isRequest' => 3]);

            return response()->json([
                'ok' => true,
                'message' => 'Access request declined.',
            ]);
        }

        return response()->json(['ok' => false, 'message' => 'Unknown action.'], 422);
    }

    /**
     * Release — called when the user navigates away or closes the tab.
     */
    public function editRelease($id)
    {
        $userId = Auth::user()->id;
        Jobaccess::where('job_id', $id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json(['ok' => true]);
    }

    /*
     * Lock Job
     */
    public function LockJob($id)
    {
        $booked = Booking::findOrFail($id);

        if ($booked->locker == 0) {
            $booked->locker = 1;
        } else {
            $booked->locker = 0;
        }
        $booked->save();

        return back()->with('success', 'Job '.$booked->job_ref.' mobile visibility has been updated!');
    }

    /**
     * Request access from the lock screen (countdown page).
     */
    public function lockRequestAccess($id)
    {
        $userId = Auth::user()->id;

        $myLock = Jobaccess::where('job_id', $id)
            ->where('user_id', $userId)
            ->where('access', 1)
            ->first();

        if ($myLock) {
            return response()->json([
                'ok' => true,
                'granted' => true,
                'redirect' => route('booking.edit', ['id' => $id]),
            ]);
        }

        Jobaccess::updateOrCreate(
            ['job_id' => $id, 'user_id' => $userId],
            ['job_id' => $id, 'user_id' => $userId, 'access' => 0, 'isRequest' => 1]
        );

        return response()->json([
            'ok' => true,
            'message' => 'Access request sent. Waiting for response from current editor.',
        ]);
    }

    /**
     * Check request status from the lock screen.
     */
    public function lockRequestStatus($id)
    {
        $userId = Auth::user()->id;

        $myAccess = Jobaccess::where('job_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($myAccess && (int) $myAccess->access === 1) {
            return response()->json([
                'ok' => true,
                'granted' => true,
                'redirect' => route('booking.edit', ['id' => $id]),
            ]);
        }

        if ($myAccess && (int) $myAccess->isRequest === 3) {
            return response()->json([
                'ok' => true,
                'denied' => true,
                'message' => 'Access request denied. The current user is still working on this job.',
            ]);
        }

        return response()->json(['ok' => true, 'pending' => true]);
    }

    /**
     * Force access from the lock screen and take over lock ownership.
     */
    public function lockForceAccess($id)
    {
        $userId = Auth::user()->id;

        Jobaccess::updateOrCreate(
            ['job_id' => $id, 'user_id' => $userId],
            ['job_id' => $id, 'user_id' => $userId, 'access' => 0, 'isRequest' => 1]
        );

        Jobaccess::where('job_id', $id)->where('user_id', '!=', $userId)->update(['access' => 0]);
        Jobaccess::where('job_id', $id)->where('user_id', $userId)->update(['access' => 1, 'isRequest' => 2]);

        return response()->json([
            'ok' => true,
            'granted' => true,
            'redirect' => route('booking.edit', ['id' => $id]),
        ]);
    }

    /*
     * Drivers Contact
     */
    public function driverContact(Request $request)
    {
        $driver = $request->input('driver');
        $driverMain = $request->input('driverMain');
        $subDriver = $request->input('subDriver');
        $jobId = $request->input('jobId');
        $option = '';

        if ($driver) {
            if ($jobId and Booking::where('job_ref', $jobId)->where('driver_contact', '!=', '')->count()) {
                $booking = Booking::where('job_ref', $jobId)->first();
                $driverVal = Driverscontact::where('id', $booking->driver_contact)->withTrashed()->first();
                $value = '<option value="'.$driverVal->id.'">'.$driverVal->driver_name.'</option>';
            } else {
                $value = '<option value="">Select Driver Contact</option>';
            }
            if (Driverscontact::where('driver_id', $driver)->count()) {
                $contact = Driverscontact::where('driver_id', $driver)->orderBy('driver_name', 'asc')->get();
                $option .= '<div class="input-group">';
                $option .= '<div class="input-group-addon left p-1">Contact</div>';
                $option .= '<label class="control-label sr-only" for="driver_contact">Driver Contact</label>';
                $option .= '<select name="driver_contact"  class="form-control styler" id="driverInfo" onchange="driverInfoSel()">';
                $option .= $value;
                foreach ($contact as $row) {
                    $option .= '<option value="'.$row->id.'">'.$row->driver_name.'</option>';
                }
                $option .= '</select>';
                $option .= '<div class="input-group-addon right p-1">';
                $option .= '<a href="#" class="btn btn-info btn-xs" data-toggle="modal" data-target="#driverInfoModalCenter"><i class="fa fa-info-circle"></i></a>';
                $option .= '</div>';
                $option .= '</div>';
            } else {
                $option .= $this->listStorageUnits($driver, $jobId, 'main');
            }
            if (Drivers::where('driver_id', $driver)->where('driver_type', 'Driver')->count()) {
                if (! $jobId) {
                    $option .= $this->listStorageUnits($driver, $jobId, 'main');
                }
            }
        } elseif ($subDriver) {
            $option .= $this->listStorageUnits($subDriver, $jobId, 'sub');
        } elseif ($driverMain) {
            if (Drivers::where('driver_id', $driverMain)->where('driver_type', 'Driver')->count()) {
                $option .= $this->listStorageUnits($driverMain, $jobId, 'main');
            }
        }

        return $option;
    }

    public function listStorageUnits($subDriver, $jobId, $driverType = 'main')
    {
        $option = '';
        if ((Driverscontact::where('id', $subDriver)->count() and $driverType == 'sub') || (Drivers::where('driver_id', $subDriver)->count() and $driverType == 'main')) {
            $units = Storages::where('availability', 'Yes')->limit('500')->orderBy('id');

            $selectedChillId = null;
            $selectedAmbientId = null;
            if ($jobId) {
                $booking = Booking::where('job_ref', $jobId)->first();
                if ($booking) {
                    $selectedChillId = $booking->chill_unit ?: null;
                    $selectedAmbientId = $booking->ambient_unit ?: null;
                }
            }

            // For main driver type, also look up units assigned to any of the driver's contacts
            if ($driverType == 'main') {
                $contactIds = Driverscontact::where('driver_id', $subDriver)->pluck('id')->toArray();
                $allDriverIds = array_merge([$subDriver], $contactIds);
                $driverUnits = Storages::whereIn('current_driver', $allDriverIds)->get()->toArray();
            } else {
                $driverUnits = Storages::where('current_driver', $subDriver)->get()->toArray();
            }

            $unit1 = null;
            $unit2 = null;

            // Only use booking's selected units if they're actually assigned to the current driver
            $driverUnitIds = array_column($driverUnits, 'id');

            if ($selectedChillId && in_array($selectedChillId, $driverUnitIds)) {
                $selectedChill = Storages::where('id', $selectedChillId)->first();
                if ($selectedChill) {
                    $unit1 = [
                        'id' => $selectedChill->id,
                        'unit_number' => $selectedChill->unit_number,
                        'unit_size' => $selectedChill->unit_size,
                    ];
                }
            }
            if (! $unit1 && isset($driverUnits[0])) {
                $unit1 = $driverUnits[0];
            }

            if ($selectedAmbientId && in_array($selectedAmbientId, $driverUnitIds)) {
                $selectedAmbient = Storages::where('id', $selectedAmbientId)->first();
                if ($selectedAmbient) {
                    $unit2 = [
                        'id' => $selectedAmbient->id,
                        'unit_number' => $selectedAmbient->unit_number,
                        'unit_size' => $selectedAmbient->unit_size,
                    ];
                }
            }

            if ($unit1 && $unit2 && (int) $unit1['id'] === (int) $unit2['id']) {
                $unit2 = null;
            }

            if (! $unit2) {
                foreach ($driverUnits as $driverUnit) {
                    if (! $unit1 || (int) $driverUnit['id'] !== (int) $unit1['id']) {
                        $unit2 = $driverUnit;
                        break;
                    }
                }
            }

            // unit 1
            if ($unit1) {
                $existOption = '<option value = "'.$unit1['id'].'">'.$unit1['unit_number'].'('.$unit1['unit_size'].')</option>';
            } else {
                $existOption = '<option value="">Select Unit</option>';
            }
            // unit 2
            if ($unit2) {
                $existOption2 = '<option value = "'.$unit2['id'].'">'.$unit2['unit_number'].'('.$unit2['unit_size'].')</option>';
            } else {
                $existOption2 = '<option value="">Select Unit</option>';
            }

            $option .= '<div style="border:1.5px solid var(--border,#e2e8f0); border-radius:6px; overflow:hidden; margin-top:4px;">
                                        <div style="background:var(--surface-alt,#f8fafc); border-bottom:1.5px solid var(--border,#e2e8f0); padding:3px 8px; font-size:.7rem; font-weight:600; color:var(--text-secondary,#64748b); letter-spacing:.04em; text-transform:uppercase;">Storage Unit</div>
                                        <div style="padding:.4rem .5rem;">
                                            <div style="display:flex; gap:6px; align-items:center;">
                                                <div style="flex:1; min-width:0;">
                                                    <select name="chill_unit" id="chill_unit" class="form-control styler" style="font-size:12px; height:30px;">';
            $option .= $existOption;
            if ($units->count() > 0) {
                foreach ($units->get() as $unit) {
                    $option .= '<option value = "'.$unit->id.'">'.$unit->unit_number.'('.$unit->unit_size.')</option>';
                }
            } else {
                $option .= '<option value = "" disabled>No units in store at the moment</option>';
            }
            $option .= '</select>
                                                </div>
                                                <div style="flex:1; min-width:0;">
                                                    <select name="ambient_unit" id="ambient_unit" class="form-control styler" style="font-size:12px; height:30px;">';
            $option .= $existOption2;
            if ($units->count() > 0) {
                foreach ($units->get() as $unit) {
                    $option .= '<option value = "'.$unit->id.'">'.$unit->unit_number.'('.$unit->unit_size.')</option>';
                }
            } else {
                $option .= '<option value = "" disabled>No units in store at the moment</option>';
            }
            $option .= '</select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>';
        }

        return $option;
    }

    public function driverContactInfo(Request $request)
    {
        $driver = $request->input('driver');
        $option = '';
        if (Driverscontact::where('id', $driver)->count()) {
            $contact = Driverscontact::where('id', $driver)->first();
            $option .= '<h3>'.$contact->driver_name.'</h3>';
            $option .= '<p>Vehicle Make: '.$contact->vehicle_make.'</p>';
            $option .= '<p>Vehicle Registration: '.$contact->vehicle_registeration.'</p>';
            $option .= '<p>Telephone: '.$contact->driver_phone.'</p>';
        }

        return $option;
    }

     public function downloadFile(Request $request)
    {
        $filename = $request->input('file');
        if (!Storage::disk('uploads')->exists($filename)) {
            abort(404);
        }
        $extension = pathinfo(public_path('/uploads/'.$request->input('file')), PATHINFO_EXTENSION);
        if($extension=='enc') {
            //FileVault::disk('uploads')->decryptCopy($filename);
            $filePath = public_path("uploads/" . Str::replaceLast('.enc', '', $filename));
            return response()->download($filePath)->deleteFileAfterSend(true);
        }else{
            return response()->download(public_path("uploads/" . $filename));
        }
    }

    public function deleteCollectedOrder($id)
    {
        CollectedOrders::where('id', $id)->delete();

        return back()->withInput()->with('success', 'Collected Order Delete Successfully.');
    }

    public function editPOD($id)
    {
        $booking = Booking::where('job_ref', $id)->first();
        $customers = Customers::where('customer_id', $booking->customer)->first();
        $addresses = Viaaddress::where('job_ref', $id)->whereNull('deleted_at')->orderBy('via_id')->get();
        $uploads = Upload::where('relatedId', $booking->job_ref)->where('tablekey', 'booking')->get();

        return view('admin.booking.edit-pod', compact('booking', 'customers', 'addresses', 'uploads'));
    }

    public function updatePOD($id, Request $request)
    {
        $booking = Booking::findOrFail($id);
        $booking->pod_data_verify = 1;
        $booking->delivery_notes = $request->input('delivery_notes');
        $booking->pod_signature = $request->input('pod_signature');
        $booking->pod_time = $request->input('pod_time');
        $booking->pod_date = $this->dateYMD($request->input('pod_date'));
        $booking->delivered_temperature = $request->input('delivered_temperature');
        if ($request->input('driver_note')) {
            $booking->driver_note = $request->input('driver_note');
        }

        /* Logic for multiple upload */
        if ($request->hasFile('filename')) {
            $rules = [];
            $filez = count($request->file('filename'));
            foreach (range(0, $filez) as $index) {
                $rules['filename.'.$index] = $this->mixedRules();
            }
            $valFile = Validator::make($request->all(), $rules);
            if ($valFile->fails()) {
                return response()->json(['error' => true, 'message' => $valFile->errors()->all()]);
            } else {
                $filekey = $request->file('filename');
                $this->multipleupload($filekey, $booking->job_ref, 'booking', 'mixed');
            }
        }
        $booking->save();
        $bookingId = $booking->job_ref;

        /* Process Via Addresses */
        for ($num = 1; $num <= 6; $num++) {
            $signed_by = $request->input('signed_by-'.$num);
            if ($signed_by) {
                foreach ($signed_by as $key => $value) {
                    if ($value) {
                        Viaaddress::where('via_id', $request->input('id-'.$num))
                            ->update([
                                'via_pod_data_verify' => $request->input('pod_verify-'.$num)[$key],
                                'signed_by' => $request->input('signed_by-'.$num)[$key],
                                'date' => $this->dateYMD($request->input('pod_date-'.$num)[$key]),
                                'time' => $request->input('pod_time-'.$num)[$key],
                                'delivered_temperature' => $request->input('delivered_temperature-'.$num)[$key],
                            ]);
                    }
                }
            }
        }

        // Keep storage tracking in sync when POD is approved from the dedicated POD screen.
        $bookingChillUnit = $booking->chill_unit;
        $bookingAmbientUnit = $booking->ambient_unit;
        $podComplete = (int) ($booking->pod_data_verify ?? 0) === 1
            && strlen((string) ($booking->pod_signature ?? '')) > 1
            && strlen((string) ($booking->pod_time ?? '')) > 1;

        if ($podComplete && ($bookingChillUnit || $bookingAmbientUnit)) {
            $viasPending = Viaaddress::where('job_ref', $booking->job_ref)
                ->where(function ($q) {
                    $q->whereNull('signed_by')->orWhere('signed_by', '');
                })
                ->count();

            if ($viasPending === 0) {
                if ($bookingChillUnit) {
                    Storages::where('id', $bookingChillUnit)->update(['trackable' => 0]);
                }
                if ($bookingAmbientUnit) {
                    Storages::where('id', $bookingAmbientUnit)->update(['trackable' => 0]);
                }
            }
        }

        $this->addLog('Approved Job POD '.$booking->job_ref, $bookingId);

        return redirect()->route('booking.edit', ['id' => $booking->job_ref, 'cust' => $booking->customer])->with('success', 'POD Information has been approved successfully.');
    }

    /**
     * Return only the Storage Unit card HTML for a given driver after a transfer.
     * Used to refresh #unitStorage without returning the contact dropdown.
     */
    public function storageUnitCard(Request $request)
    {
        $driverId   = $request->input('driver_id');
        $driverType = $request->input('driver_type'); // 'contact' or 'driver'
        $jobId      = $request->input('jobId', '');

        if (! $driverId) {
            return '';
        }

        if ($driverType === 'contact') {
            return $this->listStorageUnits($driverId, $jobId, 'sub');
        }

        return $this->listStorageUnits($driverId, $jobId, 'main');
    }

    /**
     * Return ALL storage units with resolved driver name for the "Show All Units" modal.
     */
    public function allUnits()
    {
        $units = Storages::leftJoin('drivers_contact', 'drivers_contact.id', '=', 'storages.current_driver')
            ->leftJoin('drivers', 'drivers.driver_id', '=', 'storages.current_driver')
            ->select(
                'storages.id',
                'storages.unit_number',
                'storages.unit_size',
                'storages.unit_type',
                'storages.availability',
                'storages.current_driver',
                'drivers_contact.driver_name',
                'drivers.driver as driver_main'
            )
            ->orderBy('storages.unit_number')
            ->get()
            ->map(function ($u) {
                $u->driver_label = $u->driver_name ?: ($u->driver_main ?: null);
                return $u;
            });

        return response()->json($units);
    }

    /**
     * Return all Driver + SubContractor drivers and their contacts for the transfer dropdown.
     * Excludes CXDriver. Each entry has a prefixed value: "contact:5" or "driver:12".
     */
    public function allDriverContacts()
    {
        $contacts = Driverscontact::orderBy('driver_name', 'asc')
            ->get(['id', 'driver_id', 'driver_name'])
            ->map(function ($c) {
                return ['value' => 'contact:'.$c->id, 'label' => $c->driver_name.' (Contact)'];
            });

        $drivers = Drivers::whereIn('driver_type', ['Driver', 'SubContractor'])
            ->orderBy('driver', 'asc')
            ->get(['driver_id', 'driver', 'driver_type'])
            ->map(function ($d) {
                return ['value' => 'driver:'.$d->driver_id, 'label' => $d->driver.' ('.$d->driver_type.')'];
            });

        $merged = $contacts->concat($drivers)->sortBy('label')->values();

        return response()->json($merged);
    }

    /**
     * Transfer selected units to a new driver.
     * Default behavior keeps existing target units; optional replace mode clears them.
     */
    public function transferUnits(Request $request)
    {
        $unitIds   = $request->input('unit_ids', []);
        $newDriver = $request->input('new_driver'); // format: "contact:5" or "driver:12"

        if (empty($unitIds) || ! $newDriver) {
            return response()->json(['error' => true, 'message' => 'Missing unit IDs or driver']);
        }

        // Parse the type-prefixed value
        $parts       = explode(':', $newDriver, 2);
        if (count($parts) !== 2 || ! in_array($parts[0], ['contact', 'driver'], true) || ! is_numeric($parts[1])) {
            return response()->json(['error' => true, 'message' => 'Invalid driver selection']);
        }
        $driverType  = $parts[0]; // 'contact' or 'driver'
        $rawId       = (int) $parts[1];
        $replaceExisting = $request->boolean('replace_existing');

        $unitIds = collect($unitIds)
            ->map(function ($id) {
                return (int) $id;
            })
            ->filter(function ($id) {
                return $id > 0;
            })
            ->unique()
            ->values()
            ->toArray();

        if (empty($unitIds)) {
            return response()->json(['error' => true, 'message' => 'No valid units selected']);
        }

        // Record old driver IDs before the transfer
        $previousDriverIds = Storages::whereIn('id', $unitIds)
            ->pluck('current_driver')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        if ($replaceExisting) {
            $targetDriverIds = [$rawId];
            if ($driverType === 'driver') {
                $contactIds = Driverscontact::where('driver_id', $rawId)->pluck('id')->toArray();
                $targetDriverIds = array_merge($targetDriverIds, $contactIds);
            }

            // Replace mode: remove units not selected from target driver scope.
            Storages::whereIn('current_driver', $targetDriverIds)
                ->whereNotIn('id', $unitIds)
                ->update(['current_driver' => '', 'availability' => 'Yes', 'job_id' => 0, 'trackable' => 0]);
        }

        // Assign only the selected units to the new driver
        Storages::whereIn('id', $unitIds)->update([
            'current_driver' => $rawId,
            'availability'   => 'No',
        ]);

        // Resolve new driver label for the response
        if ($driverType === 'contact') {
            $dc    = Driverscontact::find($rawId);
            $label = $dc ? $dc->driver_name : '';
        } else {
            $dr    = Drivers::where('driver_id', $rawId)->first();
            $label = $dr ? $dr->driver : '';
        }

        return response()->json([
            'success'          => true,
            'message'          => 'Units transferred successfully',
            'unit_ids'         => $unitIds,
            'new_driver'       => $rawId,
            'driver_type'      => $driverType,
            'driver_label'     => $label,
            'previous_driver_ids' => $previousDriverIds,
        ]);
    }
}
