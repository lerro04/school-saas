<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'school_name'  => 'required|string|max:255',
            'school_email' => 'required|email|unique:tenants,email',
            'school_id'    => 'required|string|max:50|unique:tenants,id|regex:/^[a-z0-9\-]+$/',
            'admin_name'   => 'required|string|max:255',
            'admin_email'  => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8|confirmed',
        ]);

        // Create tenant (triggers DB creation via event)
        $tenant = Tenant::create([
            'id'    => $request->school_id,
            'name'  => $request->school_name,
            'email' => $request->school_email,
        ]);

        $tenant->domains()->create([
            'domain' => $request->school_id . '.localhost',
        ]);

        // Create subscription (trial)
        Subscription::create([
            'tenant_id'    => $tenant->id,
            'plan'         => 'trial',
            'status'       => 'active',
            'starts_at'    => now(),
            'expires_at'   => now()->addDays(30),
            'max_students' => 50,
        ]);

        // Initialize tenancy to create admin user inside tenant DB
        tenancy()->initialize($tenant);

        $user = User::create([
            'name'     => $request->admin_name,
            'email'    => $request->admin_email,
            'password' => Hash::make($request->admin_password),
        ]);

        $user->assignRole('school-admin');

        $token = $user->createToken('auth_token')->plainTextToken;

        tenancy()->end();

        return response()->json([
            'message' => 'School registered successfully',
            'tenant'  => [
                'id'     => $tenant->id,
                'name'   => $tenant->name,
                'domain' => $request->school_id . '.localhost',
            ],
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'tenant_id' => 'required|string|exists:tenants,id',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        tenancy()->initialize($tenant);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            tenancy()->end();
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
        ];

        tenancy()->end();

        return response()->json([
            'message'   => 'Login successful',
            'user'      => $userData,
            'token'     => $token,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    /**
     * Request a password reset link
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'tenant_id' => 'required|string|exists:tenants,id',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        tenancy()->initialize($tenant);

        $user = User::where('email', $request->email)->first();

        tenancy()->end();

        if (!$user) {
            // Don't reveal whether the email exists for security reasons
            return response()->json([
                'message' => 'If an account exists with this email, a password reset link will be sent.',
            ]);
        }

        // TODO: Implement actual email sending with password reset link
        // For now, return a token that can be used to reset password
        $token = \Illuminate\Support\Str::random(60);
        
        // Store reset token in cache (expires in 1 hour)
        cache()->put("password_reset_{$token}", $user->email, now()->addHour());

        return response()->json([
            'message' => 'If an account exists with this email, a password reset link will be sent.',
            'reset_token' => $token, // In production, send this via email instead
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
            'tenant_id' => 'required|string|exists:tenants,id',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        tenancy()->initialize($tenant);

        // Verify token
        $email = cache()->get("password_reset_{$request->token}");

        if (!$email || $email !== $request->email) {
            tenancy()->end();
            throw ValidationException::withMessages([
                'token' => ['Invalid or expired password reset token.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            tenancy()->end();
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Invalidate the token
        cache()->forget("password_reset_{$request->token}");

        tenancy()->end();

        return response()->json([
            'message' => 'Password reset successfully. You can now login with your new password.',
        ]);
    }

    /**
     * Change password for authenticated user
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}
