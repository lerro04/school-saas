<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\FeeInvoiceController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaynowController;

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Paynow
Route::prefix('paynow')->group(function () {
    Route::post('/initiate', [PaynowController::class, 'initiate']);
    Route::post('/poll',     [PaynowController::class, 'poll']);
});

// Paynow webhook - no auth needed (called by Paynow servers)
Route::post('/paynow/webhook', [PaynowController::class, 'webhook']);

    // Staff
Route::apiResource('staff', StaffController::class);

// Payroll
Route::post('/payroll/mark-paid', [PayrollController::class, 'markPaid']);
Route::apiResource('payroll', PayrollController::class);

    // Students
    Route::apiResource('students', StudentController::class);

    // Fee Invoices
    Route::post('/fee-invoices/bulk', [FeeInvoiceController::class, 'bulkCreate']);
    Route::apiResource('fee-invoices', FeeInvoiceController::class);

    // Payments
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show']);

    // Reports
Route::prefix('reports')->group(function () {
    Route::get('/dashboard',            [ReportController::class, 'dashboard']);
    Route::get('/fee-collection',       [ReportController::class, 'feeCollection']);
    Route::get('/debtors',              [ReportController::class, 'debtors']);
    Route::get('/payroll-summary',      [ReportController::class, 'payrollSummary']);
    Route::get('/collections-by-method',[ReportController::class, 'collectionsByMethod']);
});

    // Super admin only
    Route::middleware('role:super-admin')->prefix('admin')->group(function () {
        Route::get('/tenants',         [TenantController::class, 'index']);
        Route::get('/tenants/{id}',    [TenantController::class, 'show']);
        Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);
    });
});