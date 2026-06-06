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
}