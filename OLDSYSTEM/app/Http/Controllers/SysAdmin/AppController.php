<?php

/**
 * Created by PhpStorm.
 * User: hezecom
 * Date: 1/29/2018
 * Time: 8:17 PM
 */

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\PermissionsGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AppController extends Controller
{
    use PermissionsGenerator;

    public function __construct()
    {
        $this->middleware(['auth', 'verifier'])->except('ArtisanMigrate');
    }

    /**
     * Generate application key
     */
    public function KeyGenerate()
    {
        Artisan::call('key:generate');
    }

    /**
     * php artisan migrate
     */
    public function ArtisanMigrate() {}

    /**
     * php artisan migrate:generate
     * or php artisan migrate:generate table1,table2,table3,table4,table5
     * ignore="table3,table4,table5"
     * Run php artisan help migrate:generate for a list of options.
     */
    public function ArtisanGenerate()
    {
        // Artisan::call('migrate:generate');
        // dd('Migration Generated');
    }

    /**
     * Artisan Commands
     */
    public function ArtisanCommands()
    {
        return view('sysadmin.settings.commands');
    }

    /**
     * Artisan Commands
     */
    public function RunArtisanCommands($command)
    {
        Artisan::call(''.$command.'');

        return back()->withInput()->with('status', 'Command executed successfully!');
    }

    public function ArtisanClearCache()
    {
        Artisan::call('optimize:clear');

        /*Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('view:clear');*/
        return back()->withInput()->with('status', 'Command executed successfully!');
    }

    // Create a cache file for faster configuration loading
    public function ArtisanConfigCache()
    {
        Artisan::call('config:cache');
    }

    // Remove the configuration cache file
    public function ArtisanConfigClear()
    {
        Artisan::call('config:clear');
    }

    public function ListDB(Request $request)
    {
        $backups = Storage::disk('backup')->files();

        // print_r($directories);
        return view('sysadmin.settings.backup', compact('backups'));
    }

    // Database Management
    public function BackupDB()
    {
        $filename = 'backup-' . date('Y-m-d_His') . '.sql';
        $disk = Storage::disk('backup');
        $localPath = $disk->path($filename);
        if (!is_dir(dirname($localPath))) {
            mkdir(dirname($localPath), 0755, true);
        }
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $command = sprintf(
            'MYSQL_PWD=%s mysqldump --host=%s --port=%s --user=%s --single-transaction --routines --triggers %s > %s 2>&1',
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($localPath)
        );
        exec($command, $output, $returnCode);
        if ($returnCode !== 0) {
            $error = implode("\n", $output);
            return back()->withInput()->with('error', 'Backup failed: ' . $error);
        }
        if (!$disk->exists($filename)) {
            return back()->withInput()->with('error', 'Backup command ran but file was not found at: ' . $localPath);
        }
        return back()->withInput()->with('status', 'Database backup "' . $filename . '" created successfully!');
    }

    public function RestoreDB($name)
    {
        $name = basename($name);
        $filename = pathinfo($name, PATHINFO_EXTENSION) === 'sql' ? $name : $name . '.sql';
        $localPath = storage_path('app/backup/' . $filename);

        if (!file_exists($localPath)) {
            return back()->withInput()->with('error', 'Backup file "' . $filename . '" not found.');
        }
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port', 3306);
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = sprintf(
            'MYSQL_PWD=%s mysql --host=%s --port=%s --user=%s %s < %s 2>&1',
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($localPath)
        );
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            $error = implode("\n", $output);
            return back()->withInput()->with('error', 'Restore failed: ' . $error);
        }

        return back()->withInput()->with('status', 'Database "' . $filename . '" restored successfully!');
    }

    public function ListBackupsRaw()
    {
        $disk = Storage::disk('backup');
        $files = $disk->files();
        echo '<h2>Backup Files</h2>';
        if (empty($files)) {
            echo '<p>No backups found.</p>';
            return;
        }
        foreach ($files as $file) {
            $size = $disk->size($file);
            $modified = date('Y-m-d H:i:s', $disk->lastModified($file));
            $download = route('backup.download', ['name' => $file]);
            echo "<p>
                <strong>{$file}</strong> &nbsp;
                ({$size}) &nbsp;
                <small>{$modified}</small> &nbsp;
                <a href='{$download}'>Download</a>
              </p><hr>";
        }
    }

    public function DownloadDB($name)
    {
        $name = basename($name);
        $filename = pathinfo($name, PATHINFO_EXTENSION) === 'sql' ? $name : $name . '.sql';
        $disk = Storage::disk('backup');

        if (!$disk->exists($filename)) {
            return back()->withInput()->with('error', 'Backup file "' . $filename . '" not found.');
        }
        $localPath = $disk->path($filename);
        return response()->download($localPath, $filename, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function DeleteDB($name)
    {
        $name = basename($name);
        $filename = pathinfo($name, PATHINFO_EXTENSION) === 'sql' ? $name : $name . '.sql';

        if (!Storage::disk('backup')->exists($filename)) {
            return back()->withInput()->with('error', 'Backup file "' . $filename . '" not found.');
        }

        Storage::disk('backup')->delete($filename);

        return back()->withInput()->with('status', 'Backup "' . $filename . '" deleted successfully!');
    }
}
