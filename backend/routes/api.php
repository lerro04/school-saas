<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\FeeInvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RevenueController;
use App\Http\Controllers\Api\ExpenseController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\PaynowController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\Portal\AuthController as PortalAuthController;
use App\Http\Controllers\Api\Portal\AssignmentController as PortalAssignmentController;
use App\Http\Controllers\Api\Portal\SubmissionController as PortalSubmissionController;
use App\Http\Controllers\Api\Portal\AnnouncementController as PortalAnnouncementController;
use App\Http\Controllers\Api\Portal\StudentPortalController;
use App\Http\Controllers\Api\Portal\ParentPortalController;

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
    Route::apiResource('classes', SchoolClassController::class);

    // Fee Invoices
    Route::post('/fee-invoices/bulk', [FeeInvoiceController::class, 'bulkCreate']);
    Route::apiResource('fee-invoices', FeeInvoiceController::class);

    // Payments
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show']);

    // Revenue
    Route::apiResource('revenues', RevenueController::class);

    // Expenses
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('/expenses/approve-bulk', [ExpenseController::class, 'approveBulk']);

    // Reports
Route::prefix('reports')->group(function () {
    Route::get('/dashboard',                [ReportController::class, 'dashboard']);
    Route::get('/fee-collection',           [ReportController::class, 'feeCollection']);
    Route::get('/debtors',                  [ReportController::class, 'debtors']);
    Route::get('/payroll-summary',          [ReportController::class, 'payrollSummary']);
    Route::get('/collections-by-method',    [ReportController::class, 'collectionsByMethod']);
    Route::get('/financial-summary',        [ReportController::class, 'financialSummary']);
    Route::get('/comprehensive-financial',  [ReportController::class, 'comprehensiveFinancial']);
    Route::get('/expense-status',           [ReportController::class, 'expenseStatus']);
});

    // Super admin only
    Route::middleware('role:super-admin')->prefix('admin')->group(function () {
        Route::get('/tenants',         [TenantController::class, 'index']);
        Route::get('/tenants/{id}',    [TenantController::class, 'show']);
        Route::delete('/tenants/{id}', [TenantController::class, 'destroy']);
    });
});

// Portal routes
Route::prefix('portal')->middleware('portal.tenancy')->group(function () {

    // Public portal auth
    Route::post('/login',  [PortalAuthController::class, 'login']);

    // Protected portal routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [PortalAuthController::class, 'logout']);
        Route::get('/me',      [PortalAuthController::class, 'me']);

        // Announcements (all portal users)
        Route::get('/announcements', [PortalAnnouncementController::class, 'index']);
        Route::post('/announcements', [PortalAnnouncementController::class, 'store']);
        Route::delete('/announcements/{id}', [PortalAnnouncementController::class, 'destroy']);
        Route::put('/announcements/{id}', [PortalAnnouncementController::class, 'update']);
Route::get('/announcements/{id}', [PortalAnnouncementController::class, 'show']);

        // Assignments
        Route::get('/assignments',          [PortalAssignmentController::class, 'index']);
        Route::post('/assignments',         [PortalAssignmentController::class, 'store']);
        Route::get('/assignments/{id}',     [PortalAssignmentController::class, 'show']);
        Route::put('/assignments/{id}',     [PortalAssignmentController::class, 'update']);
        Route::delete('/assignments/{id}',  [PortalAssignmentController::class, 'destroy']);

        // Submissions
        Route::get('/submissions',           [PortalSubmissionController::class, 'index']);
        Route::post('/submissions',          [PortalSubmissionController::class, 'store']);
        Route::get('/submissions/{id}',      [PortalSubmissionController::class, 'show']);
        Route::post('/submissions/{id}/grade', [PortalSubmissionController::class, 'grade']);

        // Student portal
        Route::get('/student/dashboard', [StudentPortalController::class, 'dashboard']);
        Route::post('/student/pay-fees', [StudentPortalController::class, 'payFees']);

        // Parent portal
        Route::get('/parent/dashboard',  [ParentPortalController::class, 'dashboard']);
        Route::post('/parent/pay-fees',  [ParentPortalController::class, 'payFees']);
    });
});
