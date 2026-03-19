<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::guard('investor')->attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $investor = Auth::guard('investor')->user();

        if ($investor->status === 'pending') {
            Auth::guard('investor')->logout();
            return response()->json(['message' => 'Your account is pending admin approval. You will be notified once your account is activated.'], 403);
        }

        if ($investor->status === 'deactivated') {
            Auth::guard('investor')->logout();
            return response()->json(['message' => 'Your account has been deactivated. Please contact support.'], 403);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'investor' => $investor,
            'password_changed' => $investor->password_changed,
            'message' => 'Logged in successfully',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $investor = $request->user('investor');

        if (!Hash::check($request->current_password, $investor->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $investor->update([
            'password' => $request->new_password,
            'password_changed' => true,
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('investor')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user('investor'));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::broker('investors')->sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Password reset link sent to your email.']);
        }

        return response()->json(['message' => 'We could not find an account with that email address.'], 422);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::broker('investors')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (Investor $investor, string $password) {
                $investor->update([
                    'password' => $password,
                    'password_changed' => true,
                    'remember_token' => Str::random(60),
                ]);
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset successfully.']);
        }

        return response()->json(['message' => 'This password reset link is invalid or has expired.'], 422);
    }
}
