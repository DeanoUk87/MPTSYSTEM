<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Adminsettings;
use App\Notifications\AppNotification;
use App\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;

class AuthController extends BaseApiController
{
    /**
     * Login api
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        // Rate limiting: 5 attempts per minute per IP
        $key = 'login:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "Too many login attempts. Please try again in {$seconds} seconds.",
                429
            );
        }

        $credential = $request->input('email');
        $password   = $request->input('password');

        $field = filter_var($credential, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        if (! Auth::attempt([$field => $credential, 'password' => $password])) {
            RateLimiter::hit($key, 60);

            return $this->errorResponse('Invalid login credentials.', 401);
        }

        RateLimiter::clear($key);

        $user = Auth::user();

        $tokenResult = $user->createToken('CourierApp');

        return $this->successResponse('Login successful.', [
            'name'         => $user->name,
            'email'        => $user->email,
            'username'     => $user->username,
            'user_status'  => $user->user_status,
            'driver'       => $user->driverId,
            'access_token' => $tokenResult->accessToken,
            'token_type'   => 'Bearer',
        ]);
    }

    /**
     * Register api
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => ['required', 'string', 'min:3', 'max:80'],
            'last_name'  => ['required', 'string', 'min:3', 'max:80'],
            'email'      => ['required', 'email:rfc,dns', 'max:80', 'unique:users,email'],
            'phone'      => ['required', 'string', 'max:20', 'unique:users,phone'],
            'user_type'  => ['required', 'string'],
            'password'   => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        try {
            DB::beginTransaction();

            $verificationToken = $this->verifyCode();

            $user = User::create([
                'name'         => trim($request->input('first_name') . ' ' . $request->input('last_name')),
                'email'        => $request->input('email'),
                'phone'        => $request->input('phone'),
                'user_type'    => $request->input('user_type'),
                'language'     => $request->input('language', 'en'),
                'password'     => bcrypt($request->input('password')),
                'verify_token' => $verificationToken,
                'user_status'  => 0,
            ]);

            $user->assignRole($request->input('user_type'));

            $this->sendVerificationEmail($user, $verificationToken);

            DB::commit();

            return $this->successResponse('Registration successful. Please check your email to verify your account.');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Registration failed', ['error' => $e->getMessage(), 'email' => $request->input('email')]);

            return $this->errorResponse('Registration failed. Please try again later.', 500);
        }
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'user' => ['required', 'email'],
        ]);

        // Rate limiting: 3 resend attempts per 10 minutes per IP
        $key = 'resend-verification:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "Too many requests. Please try again in {$seconds} seconds.",
                429
            );
        }

        $email = $request->input('user');

        // Use status=0 (unverified), consistent field name
        $user = User::where('email', $email)
                    ->whereNull('user_status')
                    ->first();

        // Always return the same message to prevent user enumeration
        if (! $user) {
            RateLimiter::hit($key, 600);
            return $this->successResponse('If that email exists and is unverified, we have resent the verification code.');
        }

        try {
            $verificationToken = $this->verifyCode();

            $user->update(['verify_token' => $verificationToken]);

            $this->sendVerificationEmail($user, $verificationToken);

            RateLimiter::hit($key, 600);

            return $this->successResponse('Verification code resent. Please check your email.');
        } catch (\Throwable $e) {
            Log::error('Resend verification failed', ['error' => $e->getMessage(), 'email' => $email]);

            return $this->errorResponse('Could not resend verification email. Please try again later.', 500);
        }
    }

    /**
     * Verify user account
     */
    public function verifyUser(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'user' => ['required', 'email'],
        ]);

        $token = $request->input('code');
        $email = $request->input('user');

        $user = User::where('verify_token', $token)
                    ->where('email', $email)
                    ->where('user_status', 0)
                    ->first();

        if (! $user) {
            return $this->errorResponse('Invalid or expired verification code.', 422);
        }

        if ($user->email_verified_at) {
            return $this->errorResponse('This email has already been verified.', 409);
        }

        try {
            $user->update([
                'email_verified_at' => Carbon::now(),
                'user_status'       => 1,
                'verify_token'      => null,
            ]);

            $this->sendWelcomeEmail($user);

            return $this->successResponse('Your account has been successfully verified. You can now log in.');
        } catch (\Throwable $e) {
            Log::error('Verification failed', ['error' => $e->getMessage(), 'email' => $email]);

            return $this->errorResponse('Verification failed. Please try again.', 500);
        }
    }

    /**
     * Logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $accessToken = $request->user()->token();
            $accessToken->revoke();

            return $this->successResponse('You have been successfully logged out.');
        } catch (\Throwable $e) {
            Log::error('Logout failed', ['error' => $e->getMessage()]);

            return $this->errorResponse('Logout failed. Please try again.', 500);
        }
    }

    /**
     * Generate a secure 6-digit verification code.
     */
    private function verifyCode(): string
    {
        return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Send verification email notification.
     */
    private function sendVerificationEmail(User $user, string $token): void
    {
        $setting = Adminsettings::first();

        $details = [
            'subject'    => $setting->company_name . ' — Email Verification',
            'from'       => $setting->notification_email,
            'greeting'   => 'You are almost there!',
            'body'       => '<p style="text-align:left">Your verification code is:</p>',
            'itemCode'   => '<h1 style="text-align:left;font-size:20px">' . e($token) . '</h1>',
            'thanks'     => 'Thank you for choosing ' . $setting->company_name,
            'actionText' => 'Learn more',
            'actionURL'  => url('/'),
        ];

        Notification::route('mail', $user->email)->notify(new AppNotification($details));
    }

    /**
     * Send welcome email after successful verification.
     */
    private function sendWelcomeEmail(User $user): void
    {
        $setting = Adminsettings::first();

        $details = [
            'subject'    => 'Welcome to ' . $setting->company_name,
            'from'       => $setting->notification_email,
            'greeting'   => 'Account creation was successful!',
            'body'       => 'Start exploring our services.',
            'itemCode'   => '',
            'thanks'     => 'Thank you for choosing ' . $setting->company_name,
            'actionText' => 'Get Started',
            'actionURL'  => url('/'),
        ];

        Notification::route('mail', $user->email)->notify(new AppNotification($details));
    }
}