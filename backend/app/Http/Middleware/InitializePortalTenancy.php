<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;

class InitializePortalTenancy
{
    public function handle(Request $request, Closure $next)
    {
        $tenantId = $request->header('X-Tenant-ID') 
            ?? $request->input('tenant_id')
            ?? session('portal_tenant');

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                tenancy()->initialize($tenant);
            }
        }

        $response = $next($request);

        tenancy()->end();

        return $response;
    }
}