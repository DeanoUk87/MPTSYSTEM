<?php

namespace App\Http\Controllers\Admin;

use App\Exports\StoragesExports;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\Uploader;
use App\Imports\StoragesImports;
use App\Models\Drivers;
use App\Models\Driverscontact;
use App\Models\Storages;
use App\Models\Storageusage;
use App\Services\StorageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Validator;
use Yajra\DataTables\Facades\DataTables;

class StoragesController extends Controller
{
    use Uploader;

    /**
     * StoragesController constructor.
     */
    public function __construct()
    {
        $this->middleware(['auth', 'verifier']);
    }

    /**
     * This method display storages view for datatable
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function index(Request $request)
    {
        return view('admin.storages.index');
    }

    /**
     * Load storages data for view table
     *
     * @return mixed
     */
    public function getdata()
    {
        $storages = Storages::leftJoin('drivers_contact', 'drivers_contact.id', '=', 'storages.current_driver')
            ->leftJoin('drivers', 'drivers.driver_id', '=', 'storages.current_driver')
            ->select('drivers_contact.driver_name', 'drivers.driver as driverMain', 'storages.*')
            ->orderBy('storages.unit_number');

        return Datatables::of($storages)
            ->addColumn('checkbox', function ($storages) {
                return '<input type="checkbox" name="checkbox[]" id="box-'.$storages->id.'" class="check-style filled-in blue"  onclick="toggleBtn()" value="'.$storages->id.'"> 
                <label for="box-'.$storages->id.'" class="checkinner"></label>';
            })
            ->editColumn('current_driver', function ($storages) {
                if ($storages->current_driver) {
                    if ($storages->driver_name) {
                        return '<a href="#" class="btn btn-outline-dark btn-xs">'.$storages->driver_name.'</a>';
                    }

                    return '<a href="#" class="btn btn-outline-dark btn-xs">'.$storages->driverMain.'</a>';
                }

                return '<a href="#" class="btn btn-outline-dark btn-xs">none</a>';
            })
            ->addColumn('availability', function ($storages) {
                if (! $storages->current_driver) {
                    return '<a href="javascript:void(0)" class="btn btn-outline-success btn-xs">In Store</a>';
                }

                return '<a href="'.route('storages.availabilityStatus', $storages->id).'" class="btn btn-outline-danger btn-xs" onclick="return confirm(\'Mark as Available\')">Unavailable</a>';
            })
            ->editColumn('calibration_date', function ($booking) {
                return Carbon::parse($booking->calibration_date)->format('M, d Y');
            })
            ->addColumn('expires', function ($booking) {
                $timeNow = Carbon::now(config('timezone'));
                $expires = Carbon::parse($booking->calibration_date, config('timezone'));

                if ($timeNow->diffInDays($expires) > 1) {
                    $humanTime = number_format($timeNow->diffInDays($expires)).' days';
                } else {
                    $humanTime = number_format($timeNow->diffInDays($expires)).' day';
                }

                if (($timeNow) > $expires) {
                    $timeLeft = '<a href="#" class="btn btn-outline-danger btn-xs">Expired</a>';
                } else {
                    $timeLeft = '<a href="#" class="btn btn-outline-success btn-xs">'.$humanTime.'</a>';
                }

                return $timeLeft;
            })
            ->setRowAttr([
                'style' => function ($booking) {
                    if ($booking->availability == 'Yes') {
                        return 'background-color: #e8f5e9;';
                    } else {
                        return 'background-color: #fff8e1;';
                    }
                },
            ])
            ->editColumn('trackable', function ($storages) {
                if ($storages->trackable === 1) {
                    return '<a href="'.route('storages.tracking', ['id' => $storages->id, 'trackable' => $storages->trackable]).'" class="btn btn-success btn-xs">Enabled</a>';
                }

                return '<a href="'.route('storages.tracking', ['id' => $storages->id, 'trackable' => $storages->trackable]).'" class="btn btn-warning btn-xs">Disabled</a>';
            })
            ->addColumn('action', function ($storages) {
                $driverLabel = $storages->driver_name ?: ($storages->driverMain ?: '');
                return '
           <div class="btn-group btn-group-xs" role="group" aria-label="actions"> 
           <a href="'.route('storages.details', $storages->id).'" class="btn btn-info btn-xs"><i class="fa fa-eye"></i></a> 
           <a href="javascript:viod(0)" data-id="row-'.$storages->id.'" onclick="editForm(\''.url('admin/storages/edit').'\','.$storages->id.')" class="btn btn-success btn-xs"><i class="fa fa-pencil"></i></a>
           <a href="javascript:void(0)" class="btn btn-warning btn-xs" onclick="openTransferModal('.$storages->id.',\''.addslashes($storages->unit_number).'\',\''.addslashes($storages->unit_size).'\',\''.addslashes($driverLabel).'\')" title="Transfer Unit"><i class="fa fa-exchange"></i></a>
           <a href="javascript:viod(0)" data-id="row-'.$storages->id.'" onclick="deleteData(\''.url('admin/storages/delete').'\','.$storages->id.')" class="btn btn-danger btn-xs"><i class="fa fa-trash"></i></a> 
           </div>';
            })
            ->rawColumns(['checkbox', 'action', 'expires', 'current_driver', 'availability', 'trackable'])->make(true);
    }

    public function storageHistory(Request $request)
    {
        $id = $request->input('id');
        $storages = Storageusage::leftJoin('drivers_contact', 'drivers_contact.id', '=', 'storage_usage.driver_id')
            ->leftJoin('drivers', 'drivers.driver_id', '=', 'storage_usage.driver_id')
            ->select('drivers_contact.driver_name as driver', 'drivers.driver as driverMain', 'storage_usage.*')
            ->where('unit_id', $id);

        return Datatables::of($storages)
            ->editColumn('created_at', function ($storages) {
                return Carbon::parse($storages->created_at)->format('M, d Y H:ia');
            })
            ->editColumn('driver', function ($storages) {
                if ($storages->driver) {
                    return $storages->driver;
                }

                return $storages->driverMain;
            })
            ->editColumn('job_id', function ($storages) {
                if ($storages->job_id) {
                    return '<a href="'.route('booking.details', ['id' => $storages->job_id]).'" target="_blank" class="btn btn-outline-success btn-xs">'.
                        $storages->job_id.'';
                }
            })
            ->editColumn('trackable', function ($storages) {
                $trackable = $storages->trackable ?? 0;
                if ($trackable === 1) {
                    return '<a href="'.route('storages.tracking', ['id' => $storages->id, 'trackable' => $trackable]).'" class="btn btn-success btn-xs">Enabled</a>';
                }

                return '<a href="'.route('storages.tracking', ['id' => $storages->id, 'trackable' => $trackable]).'" class="btn btn-danger btn-xs">Disabled</a>';
            })
            ->rawColumns(['job_id', 'trackable'])->make(true);
    }

    /**
     * Web route for the unit temperature alert popup (authenticated, no API token needed)
     */
    public function unitAlerts()
    {
        try {
            $service = app(StorageService::class);
            $data = $service->getSensorData();
            return response()->json([
                'result'       => true,
                'messages'     => $data['messages'],
                'messageCount' => $data['messageCount'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'result'       => false,
                'messages'     => [],
                'messageCount' => 0,
            ]);
        }
    }

    public function availabilityStatus($id)
    {
        $booked = Storages::findOrFail($id);
        $booked->availability = 'Yes';
        $booked->current_driver = '';
        $booked->job_id = 0;
        $booked->save();

        return back()->with('success', 'Unit availability updated successfully');
    }

    /**
     * Return units currently assigned to a given driver (AJAX)
     */
    public function unitsByDriver(Request $request)
    {
        $driverId = $request->input('driver_id');
        if (! $driverId) {
            return response()->json([]);
        }

        // Check if this is a main driver — also include units assigned to their contacts
        $isMainDriver = Drivers::where('driver_id', $driverId)->exists();
        if ($isMainDriver) {
            $contactIds = Driverscontact::where('driver_id', $driverId)->pluck('id')->toArray();
            $allIds = array_merge([$driverId], $contactIds);
            $units = Storages::whereIn('current_driver', $allIds)
                ->get(['id', 'unit_number', 'unit_size', 'unit_type', 'current_driver']);
        } else {
            $units = Storages::where('current_driver', $driverId)
                ->get(['id', 'unit_number', 'unit_size', 'unit_type', 'current_driver']);
        }

        return response()->json($units);
    }

    /**
     * Return list of non-CX drivers for the transfer modal (AJAX)
     */
    public function driversForTransfer()
    {
        $drivers = Drivers::whereIn('driver_type', ['Driver', 'SubContractor'])
            ->orderBy('driver', 'asc')
            ->get(['driver_id', 'driver', 'driver_type']);

        $contacts = Driverscontact::orderBy('driver_name', 'asc')
            ->get(['id', 'driver_id', 'driver_name']);

        return response()->json([
            'drivers'  => $drivers,
            'contacts' => $contacts,
        ]);
    }

    /**
     * Transfer a storage unit to a different driver.
     * Default behavior keeps target units; optional replace mode clears target units first.
     */
    public function transferUnit(Request $request, $id)
    {
        $newDriverId = $request->input('driver_id');
        $replaceExisting = $request->boolean('replace_existing');

        if (! $newDriverId) {
            return response()->json(['error' => true, 'message' => 'No driver selected']);
        }

        if ($replaceExisting) {
            $targetDriverIds = [$newDriverId];

            // If the target is a main driver, include contact-owned units in replace scope.
            if (Drivers::where('driver_id', $newDriverId)->exists()) {
                $contactIds = Driverscontact::where('driver_id', $newDriverId)->pluck('id')->toArray();
                $targetDriverIds = array_merge($targetDriverIds, $contactIds);
            }

            Storages::whereIn('current_driver', $targetDriverIds)
                ->where('id', '!=', $id)
                ->update(['current_driver' => '', 'availability' => 'Yes', 'job_id' => 0, 'trackable' => 0]);
        }

        // Assign this unit to the new driver
        $unit = Storages::findOrFail($id);
        $unit->current_driver = $newDriverId;
        $unit->availability   = 'No';
        $unit->save();

        Storageusage::create([
            'unit_id'   => $id,
            'driver_id' => $newDriverId,
            'job_id'    => $unit->job_id ?: null,
        ]);

        return response()->json(['success' => true, 'message' => 'Unit transferred successfully']);
    }

    public function updateTrakingStatus($id, $tracking)
    {
        $store = Storages::findOrFail($id);
        if ((int) $tracking === 1) {
            $store->trackable = 0;
        } else {
            $store->trackable = 1;
        }
        $store->save();

        return back()->with('success', 'Tracking status updated successfully');
    }

    /**
     * This method select storages details
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function details($id)
    {
        // $storages = Storages::findOrFail($id);
        $storages = Storages::leftJoin('drivers', 'drivers.driver_id', '=', 'storages.current_driver')->findOrFail($id);

        return view('admin.storages.details', compact('storages'));
    }

    /**
     * This method load storages form
     *
     * @return mixed
     */
    public function insert()
    {
        return view('admin.storages.create');
    }

    public function store(Request $request)
    {
        /* validate storages data */
        $validator = Validator::make($request->all(),
            [
                'unit_number' => 'required',
            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $data = [
                'unit_number' => $request->input('unit_number'),
                'imei' => $request->input('imei'),
                'unit_size' => $request->input('unit_size'),
                'availability' => $request->input('availability'),
                'unit_type' => $request->input('unit_type'),
                'current_driver' => $request->input('current_driver'),
                'calibration_date' => $this->dateYMD($request->input('calibration_date')),
            ];
            Storages::create($data);

            return response()->json(['success' => true, 'message' => trans('app.add.success')]);
        }
    }

    /**
     * Select storages edit
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function edit($id)
    {
        $storages = Storages::findOrFail($id);

        return view('admin.storages.edit', compact('storages'));
    }

    /**
     * This method process storages edit form
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        /* validate storages data */
        $validator = Validator::make($request->all(),
            [
                'unit_number' => 'required',
            ]
        );

        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            $storages = Storages::findOrFail($id);
            $storages->unit_number = $request->input('unit_number');
            $storages->imei = $request->input('imei');
            $storages->unit_size = $request->input('unit_size');
            $storages->availability = $request->input('availability');
            $storages->unit_type = $request->input('unit_type');
            $storages->calibration_date = $this->dateYMD($request->input('calibration_date'));
            $storages->save();

            return response()->json(['success' => true, 'message' => trans('app.update.success')]);
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
            Storages::findOrFail($id)->delete();

            return response()->json(['success' => true, 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Delete with checkbox
     *
     * @param  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deletemulti(Request $request)
    {
        $requestData = $request->input('checkbox', []);
        if (count($requestData) > 0) {
            foreach ($requestData as $id) {
                Storages::where('id', $id)->delete();
            }

            return response()->json(['success' => 'delete', 'message' => trans('app.delete.success')]);
        }

        return response()->json(['error' => true, 'message' => trans('app.delete.error')]);
    }

    /**
     * Export to PDF
     *
     * @return mixed
     */
    public function exportPDF(Request $request)
    {
        $storages = Storages::all();
        $pdf = Pdf::loadView('admin.storages.print', compact('storages'));

        return $pdf->download('storages_data.pdf');
    }

    public function exportDetailPDF($id)
    {
        $storages = Storages::findOrFail($id);
        $pdf = Pdf::loadView('admin.storages.print-details', compact('storages'));

        return $pdf->download('storages_data_details.pdf');
    }

    /**
     * load import template
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function importExportView()
    {
        return view('admin.storages.import');
    }

    /**
     * Process imported file
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function importFile(Request $request)
    {
        if ($request->hasFile('storages_file')) {
            $path = $request->file('storages_file')->getRealPath();
            Excel::import(new StoragesImports, $path);

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
        return (new StoragesExports)->download('storages.'.$type);
    }

    /**
     * This method load storages form
     *
     * @return mixed
     */
    public function notification()
    {
        return view('admin.storages.notification');
    }
}
