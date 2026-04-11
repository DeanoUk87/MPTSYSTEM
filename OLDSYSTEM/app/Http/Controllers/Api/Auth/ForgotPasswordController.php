<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Notifications\AppNotification;
use App\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;

class ForgotPasswordController extends BaseApiController
{
    /**
     * Step 1 — Request a password reset code.
     */
    public function sendForgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => ['required', 'string', 'max:255'],
        ]);

        // Rate limit: 3 attempts per 10 minutes per IP
        $key = 'forgot-password:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "Too many requests. Please try again in {$seconds} seconds.",
                429
            );
        }

        RateLimiter::hit($key, 600);

        $userId = $request->input('userId');
        $user = $this->findUser($userId);

        // Always return success to prevent user enumeration
        if ($user) {
            try {
                $token = $this->generateVerificationCode();
            
                DB::transaction(function () use ($user, $token) {
                    $user->verify_token = $token;
                    $user->save();
                    $this->sendResetEmail($user, $token); 
                });
                
            } catch (\Throwable $e) {
                Log::error('Password reset email failed', [
                    'error' => $e->getMessage(),
                    'userId' => $userId,
                ]);

                return $this->errorResponse(
                    'We were unable to send the reset email. Please try again later.',
                    500
                );
            }
        }

        return $this->successResponse(
            'If an account exists with that identifier, a reset code has been sent.'
        );
    }

    /**
     * Step 1b — Resend reset code.
     */
    public function resendVerificationCode(Request $request): JsonResponse
    {
        $request->validate([
            'userId' => ['required', 'string', 'max:255'],
        ]);

        $key = 'resend-reset:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->errorResponse(
                "Too many requests. Please try again in {$seconds} seconds.",
                429
            );
        }

        RateLimiter::hit($key, 600);

        $userId = $request->input('userId');
        $user = $this->findUser($userId);

        // Same response whether user exists or not
        if ($user) {
            try {
                $token = $this->generateVerificationCode();

                DB::transaction(function () use ($user, $token) {
                    $user->verify_token = $token;
                    $user->save();
                    $this->sendResetEmail($user, $token); 
                });

            } catch (\Throwable $e) {
                Log::error('Resend reset code failed', [
                    'error' => $e->getMessage(),
                    'userId' => $userId,
                ]);
            }
        }

        return $this->successResponse(
            'If an account exists with that identifier, a new reset code has been sent.'
        );
    }

    /**
     * Step 2 — Validate the reset code before showing the new-password form.
     */
    public function customVerifyCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'userId' => ['required', 'string', 'max:255'],
        ]);

        $token = $request->input('code');
        $userId = $request->input('userId');

        $valid = User::where('verify_token', $token)
            ->where(function ($q) use ($userId) {
                $q->where('email', $userId)
                    ->orWhere('username', $userId);
            })
            ->exists();

        if ($valid) {
            return $this->successResponse('Verification code is valid.');
        }

        return $this->errorResponse('Invalid verification code or user ID.', 422);
    }

    /**
     * Step 3 — Set the new password.
     */
    public function processForgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
            'userId' => ['required', 'string', 'max:255'],
            'password' => [
                'required',
                'string',
                Password::min(8)->mixedCase()->numbers()->symbols(),
            ],
        ]);

        $token = $request->input('code');
        $userId = $request->input('userId');
        $password = $request->input('password');

        $user = User::where('verify_token', $token)
            ->where(function ($q) use ($userId) {
                $q->where('email', $userId)
                    ->orWhere('username', $userId);
            })
            ->first();

        if (!$user) {
            return $this->errorResponse('Invalid verification code or user ID.', 422);
        }

        try {
            $user->update([
                'password' => bcrypt($password),
                'verify_token' => null, 
            ]);

            $this->sendPasswordChangedEmail($user);

            return $this->successResponse('Your password has been changed successfully.');
        } catch (\Throwable $e) {
            Log::error('Process forgot password failed', [
                'error' => $e->getMessage(),
                'userId' => $userId,
            ]);

            return $this->errorResponse('Password reset failed. Please try again.', 500);
        }
    }
    
    /**
     * Find a user by email or username.
     */
    private function findUser(string $userId): ?User
    {
        return User::where('email', $userId)
            ->orWhere('username', $userId)
            ->first();
    }

    /**
     * Generate a cryptographically secure 6-digit code.
     */
    private function generateVerificationCode(): string
    {
        return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Send the password reset code email.
     */
    private function sendResetEmail(User $user, string $token): void
    {
        Notification::route('mail', $user->email)->notify(new AppNotification([
            'subject' => config('mail.from.name') . ' — Password Reset',
            'from' => config('mail.from.address'),
            'greeting' => 'Dear ' . e($user->name) . ',',
            'body' => '<p style="text-align:left">Your password reset code is:</p>',
            'itemCode' => '<h1 style="text-align:left;font-size:20px">' . e($token) . '</h1>',
            'thanks' => 'Thank you for choosing ' . config('app.name'),
        ]));
    }

    /**
     * Notify the user that their password was successfully changed.
     */
    private function sendPasswordChangedEmail(User $user): void
    {
        Notification::route('mail', $user->email)->notify(new AppNotification([
            'subject' => config('app.name') . ' — Password Changed',
            'from' => config('mail.from.address'),
            'greeting' => 'Hi ' . e($user->name) . ',',
            'body' => 'Your password was changed successfully. If this was not you, please contact support immediately.',
            'itemCode' => '',
            'thanks' => 'Thank you for choosing ' . config('app.name'),
        ]));
    }
}