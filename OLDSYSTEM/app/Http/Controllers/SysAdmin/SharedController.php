<?php

/**
 * Created by PhpStorm.
 * User: hezecom
 * Date: 2/7/2018
 * Time: 11:50 AM
 */

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SharedController extends Controller
{
    use Uploader;

    /*public function __construct() {
        $this->middleware(['auth', 'verifier']);
    }*/
    public function deleteFileOthers($id)
    {
        $this->deleteFileWith($id);
    }

    public function deleteFileOnly($id, Request $request)
    {
        if ($request->ajax()) {
            // $product->delete( $request->all() );
            // $this->deleteFileWith($id);
            // Upload::findOrFail($id)->delete();
            $this->deleteFile($id);

            return response(['msg' => 'Product deleted', 'status' => 'success']);
        }

        return response(['msg' => 'Failed deleting the product', 'status' => 'failed']);
    }
}
