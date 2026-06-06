<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Super admin only
    Route::middleware('role:super-admin')->prefix('admin')->group(function () {
        Route::get('/tenants',         [TenantController::class, 'index']);
        Route::get('/tenants/{id}',    [TenantController::class, 'show']);
        Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);
    });
});