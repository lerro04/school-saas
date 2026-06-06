<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Subscription;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with('domains')->get()->map(function ($tenant) {
            return [
                'id'         => $tenant->id,
                'name'       => $tenant->name,
                'email'      => $tenant->email,
                'domain'     => $tenant->domains->first()?->domain,
                'created_at' => $tenant->created_at,
            ];
        });

        return response()->json($tenants);
    }

    public function show($id)
    {
        $tenant = Tenant::findOrFail($id);

        $subscription = Subscription::where('tenant_id', $id)->latest()->first();

        return response()->json([
            'tenant'       => $tenant,
            'subscription' => $subscription,
            'domain'       => $tenant->domains->first()?->domain,
        ]);
    }

    public function destroy($id)
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted successfully']);
    }
}