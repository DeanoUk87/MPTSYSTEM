<?php

namespace App\Console\Commands;

use App\Services\StorageService;
use Illuminate\Console\Command;

class SendTemperatureAlert extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'temperature:alert';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send temperature alert notifications';

    protected $storageService;

    public function __construct(StorageService $storageService)
    {
        parent::__construct();
        $this->storageService = $storageService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $this->storageService->sendEmailNotification();
            $this->info('Temperature alerts sent successfully.');
        } catch (\Exception $exception) {
            $this->error('Something went wrong: '.$exception->getMessage());
        }
    }
}
