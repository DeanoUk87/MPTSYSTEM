<?php

namespace App\Console\Commands;

use App\Models\Storages;
use App\Notifications\AppNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class CalibrationNotice extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'calibrate:storage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calibration Date Notice';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $timeNow = Carbon::now(config('timezone'))->addMonth();
        $storage = Storages::whereDate('calibration_date', $timeNow)->get();
        if (count($storage) > 0) {
            foreach ($storage as $unit) {
                $timeNow = Carbon::now(config('timezone'));
                $expires = Carbon::parse($unit->calibration_date, config('timezone'));
                $humanTime = $timeNow->diffInDays($expires);

                $details = [
                    'subject' => 'Calibration Date Expiration '.$unit->unit_number,
                    'from' => env('MAIL_FROM_ADDRESS'),
                    'greeting' => 'Calibration Date: '.Carbon::parse($unit->calibration_date)->format('M, d Y'),
                    'body' => '<p style="text-align: left">The calibration date for '.$unit->unit_number.' will be in next '.$humanTime.' days</p>',
                    'thanks' => 'Thank you.',
                ];
                Notification::route('mail', env('NOTIFICATION_EMAIL'))->notify(new AppNotification($details));
            }
        }
    }
}
