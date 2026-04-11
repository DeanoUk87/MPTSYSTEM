<?php

namespace App\Http\Controllers\Api\Settings;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends BaseApiController
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'old_password' => ['required'],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/',
            ],
            'confirm_new_password' => ['required', 'same:new_password'],
        ]);

        if (! Hash::check($validated['old_password'], $request->user()->password)) {
            return $this->errorResponse('The old password does not match our records.', 422);
        }

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return $this->successResponse('Password updated successfully');
    }
}
