<?php

/**
 * Created by PhpStorm.
 * User: hezecom
 * Date: 3/3/2018
 * Time: 12:08 AM
 */

namespace App\Http\Controllers\SysAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Validator;

class SettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'verifier', '2fa']);
    }

    public function index(Request $request)
    {
        return view('sysadmin.settings.commands');
    }

    public function store(Request $request)
    {
        /* validate mlbcourier data */
        $validator = Validator::make($request->all(),
            [
                'APP_NAME' => 'required',

            ]
        );
        if ($validator->fails()) {
            return response()->json(['error' => true, 'message' => $validator->errors()->all()]);
        } else {
            /* get post data */
            if ($request->input('FACEBOOK_AUTH') == '') {
                $facebookAuth = 'OFF';
            } else {
                $facebookAuth = $request->input('FACEBOOK_AUTH');
            }
            if ($request->input('TWITTER_AUTH') == '') {
                $twitterkAuth = 'OFF';
            } else {
                $twitterkAuth = $request->input('TWITTER_AUTH');
            }
            if ($request->input('GOOGLE_AUTH') == '') {
                $googleAuth = 'OFF';
            } else {
                $googleAuth = $request->input('GOOGLE_AUTH');
            }
            if ($request->input('EMAIL_VERIFY') == '') {
                $emailVerify = 'OFF';
            } else {
                $emailVerify = $request->input('EMAIL_VERIFY');
            }
            $data =
                'APP_NAME='."'".$request->input('APP_NAME')."'"."\n".
                'APP_ENV='.$request->input('APP_ENV')."\n".
                'GOOGLE_API_KEY='.$request->input('GOOGLE_API_KEY')."\n".
                'CRAFTY_CLICKS_API_KEY='.$request->input('CRAFTY_CLICKS_API_KEY')."\n".
                'CURRENCY_SYMBOL='.$request->input('CURRENCY_SYMBOL')."\n".
                'VAT='.$request->input('VAT')."\n".
                'APP_KEY='.$request->input('APP_KEY')."\n".
                'APP_DEBUG='.$request->input('APP_DEBUG')."\n".
                'APP_LOG_LEVEL='.$request->input('APP_LOG_LEVEL')."\n".
                'APP_URL='.$request->input('APP_URL')."\n\n".
                'REFRESH_URL_AFTER='.$request->input('REFRESH_URL_AFTER')."\n\n".

                'DB_CONNECTION='.$request->input('DB_CONNECTION')."\n".
                'DB_HOST='.$request->input('DB_HOST')."\n".
                'DB_PORT='.$request->input('DB_PORT')."\n".
                'DB_DATABASE='.$request->input('DB_DATABASE')."\n".
                'DB_USERNAME='.$request->input('DB_USERNAME')."\n".
                'DB_PASSWORD='.$request->input('DB_PASSWORD')."\n\n".

                'DB_BACKUP_PATH='.$request->input('DB_BACKUP_PATH')."\n\n".

                'BROADCAST_DRIVER='.$request->input('BROADCAST_DRIVER')."\n".
                'CACHE_DRIVER='.$request->input('CACHE_DRIVER')."\n".
                'SESSION_DRIVER='.$request->input('SESSION_DRIVER')."\n".
                'QUEUE_DRIVER='.$request->input('QUEUE_DRIVER')."\n\n".

                'TIME_ZONE='.$request->input('TIME_ZONE')."\n\n".

                'REDIS_HOST='.$request->input('REDIS_HOST')."\n".
                'REDIS_PASSWORD='.$request->input('REDIS_PASSWORD')."\n".
                'REDIS_PORT='.$request->input('REDIS_PORT')."\n\n".

                'MAIL_FROM_ADDRESS='."'".$request->input('MAIL_FROM_ADDRESS')."'"."\n".
                'MAIL_FROM_NAME='."'".$request->input('MAIL_FROM_NAME')."'"."\n".
                'MAIL_DRIVER='.$request->input('MAIL_DRIVER')."\n".
                'MAIL_HOST='.$request->input('MAIL_HOST')."\n".
                'MAIL_PORT='.$request->input('MAIL_PORT')."\n".
                'MAIL_USERNAME='.$request->input('MAIL_USERNAME')."\n".
                'MAIL_PASSWORD='.$request->input('MAIL_PASSWORD')."\n".
                'MAIL_ENCRYPTION='.$request->input('MAIL_ENCRYPTION')."\n\n".

                'PUSHER_APP_ID='.$request->input('PUSHER_APP_ID')."\n".
                'PUSHER_APP_KEY='.$request->input('PUSHER_APP_KEY')."\n".
                'PUSHER_APP_SECRET='.$request->input('PUSHER_APP_SECRET')."\n\n".

                'EMAIL_VERIFY='.$emailVerify."\n\n".

                'FACEBOOK_AUTH='.$facebookAuth."\n".
                'FACEBOOK_ID='.$request->input('FACEBOOK_ID')."\n".
                'FACEBOOK_SECRET='.$request->input('FACEBOOK_SECRET')."\n".
                'FACEBOOK_URL='.$request->input('FACEBOOK_URL')."\n\n".

                'TWITTER_AUTH='.$twitterkAuth."\n".
                'TWITTER_ID='.$request->input('TWITTER_ID')."\n".
                'TWITTER_SECRET='.$request->input('TWITTER_SECRET')."\n".
                'TWITTER_URL='.$request->input('TWITTER_URL')."\n\n".

                'GOOGLE_AUTH='.$googleAuth."\n".
                'GOOGLE_ID='.$request->input('GOOGLE_ID')."\n".
                'GOOGLE_SECRET='.$request->input('GOOGLE_SECRET')."\n".
                'GOOGLE_REDIRECT='.$request->input('GOOGLE_REDIRECT')."\n";

            Storage::disk('base')->put('.env', $data);

            return response()->json(['success' => true, 'message' => 'Srttings Saved Successfully']);
        }
    }
}
