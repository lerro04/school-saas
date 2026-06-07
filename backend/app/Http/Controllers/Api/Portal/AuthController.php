<?php
namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\PortalUser;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'     => 'required|email',
            'password'  => 'required|string',
            'tenant_id' => 'required|string|exists:tenants,id',
        ]);

        $tenant = Tenant::findOrFail($request->tenant_id);
        tenancy()->initialize($tenant);

        $user = PortalUser::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            tenancy()->end();
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('portal_token')->plainTextToken;
        $reference = $user->getReference();

        tenancy()->end();

        return response()->json([
            'message'   => 'Login successful',
            'token'     => $token,
            'tenant_id' => $tenant->id,
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'reference' => $reference,
            ],
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
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'reference' => $user->getReference(),
        ]);
    }
}