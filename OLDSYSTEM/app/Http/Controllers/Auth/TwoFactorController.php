<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function showSetup(Request $request)
    {
        $user = auth()->user();

        return view('auth.2fa.setup', compact('user'));
    }

    public function enable(Request $request)
    {
        // Ensure the user is authenticated
        if (! Auth::check()) {
            return redirect()->route('login')->withErrors(['error' => 'You must be logged in to enable 2FA.']);
        }
        $google2fa = app('pragmarx.google2fa');
        // Generate the secret key
        $secretKey = $google2fa->generateSecretKey();

        // Save it to the user profile
        $user = auth()->user();
        if ($user->google2fa_secret and $user->status_2fa) {
            $QR_Image = '';
            $secretKey = '';
            $recoveryCodes = [];
        } else {
            $user->google2fa_secret = $secretKey;
            $user->save();

            // Generate the QR code URL
            $QR_Image = $google2fa->getQRCodeInline(
                'MPT ('.$user->username.')',
                $user->email,
                $secretKey
            );
            // Generate recovery codes
            $recoveryCodes = $this->generateRecoveryCodes();
            $user->recovery_codes = $recoveryCodes;
            $user->save();
        }

        return view('auth.2fa.enable', compact('QR_Image', 'secretKey', 'recoveryCodes'));
    }

    public function disable(Request $request)
    {
        $user = auth()->user();
        $user->google2fa_secret = null;
        $user->recovery_codes = null;
        $user->save();

        return redirect()->back()->with('status', 'Two-factor authentication disabled successfully.');
    }

    public function show(Request $request)
    {
        $user = auth()->user();

        return view('auth.2fa.verify', ['user' => $user]);
    }

    public function confirm(Request $request)
    {
        $google2fa = app('pragmarx.google2fa');
        $user = auth()->user();
        $valid = $google2fa->verifyKey($user->google2fa_secret, $request->one_time_password);
        if ($valid) {
            session(['2fa_verified' => true]);

            return redirect()->route('2fa.setup')->with('status', 'Two-factor authentication setup successfully.');
        }

        return redirect()->route('2fa.show')->with('error', 'The provided code is invalid.');
    }

    public function verify(Request $request)
    {
        $user = auth()->user();
        // Check if user exists
        if (! $user) {
            return redirect()->back()->with('error', 'User not found.');
        }
        $google2fa = app('pragmarx.google2fa');
        $valid = $google2fa->verifyKey($user->google2fa_secret, $request->one_time_password);

        if ($valid) {
            session(['2fa_verified' => true]);

            return redirect()->route('home');
        }

        // using recovery
        if (in_array($request->one_time_password, $user->recovery_codes)) {
            $user->recovery_codes = array_diff($user->recovery_codes, [$request->one_time_password]);
            $user->save();
            session(['2fa_verified' => true]);

            return redirect()->route('home');
        }

        return redirect()->back()->with('error', 'The authentication code is incorrect.');
    }

    public function regenerateRecoveryCodes(Request $request)
    {
        $user = auth()->user();
        $user->recovery_codes = $this->generateRecoveryCodes();
        $user->save();

        return redirect()->back()->with('status', 'Recovery codes regenerated successfully.');
    }

    private function generateRecoveryCodes()
    {
        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $recoveryCodes[] = strtoupper(Str::random(10));
        }

        return $recoveryCodes;
    }
}
