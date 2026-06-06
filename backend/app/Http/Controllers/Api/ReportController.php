<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Staff;
use App\Models\FeeInvoice;
use App\Models\Payment;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // Main dashboard summary
    public function dashboard()
    {
        $totalStudents    = Student::where('status', 'active')->count();
        $totalStaff       = Staff::where('status', 'active')->count();
        $totalInvoiced    = FeeInvoice::sum('total_amount');
        $totalCollected   = FeeInvoice::sum('amount_paid');
        $totalOutstanding = FeeInvoice::sum('balance');
        $unpaidCount      = FeeInvoice::where('status', 'unpaid')->count();
        $partialCount     = FeeInvoice::where('status', 'partial')->count();

        // Collections this month
        $thisMonth = Payment::whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        // Collections last month
        $lastMonth = Payment::whereMonth('paid_at', now()->subMonth()->month)
            ->whereYear('paid_at', now()->subMonth()->year)
            ->sum('amount');

        // Recent payments
        $recentPayments = Payment::with('student')
            ->orderBy('paid_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'receipt'    => $p->receipt_number,
                'student'    => $p->student->first_name . ' ' . $p->student->last_name,
                'amount'     => $p->amount,
                'method'     => $p->method,
                'paid_at'    => $p->paid_at,
            ]);

        return response()->json([
            'students' => [
                'total'  => $totalStudents,
            ],
            'staff' => [
                'total' => $totalStaff,
            ],
            'fees' => [
                'total_invoiced'    => $totalInvoiced,
                'total_collected'   => $totalCollected,
                'total_outstanding' => $totalOutstanding,
                'unpaid_invoices'   => $unpaidCount,
                'partial_invoices'  => $partialCount,
                'collection_rate'   => $totalInvoiced > 0
                    ? round(($totalCollected / $totalInvoiced) * 100, 1)
                    : 0,
            ],
            'collections' => [
                'this_month' => $thisMonth,
                'last_month' => $lastMonth,
            ],
            'recent_payments' => $recentPayments,
        ]);
    }

    // Fee collection report by term
    public function feeCollection(Request $request)
    {
        $request->validate([
            'term' => 'nullable|string',
        ]);

        $query = FeeInvoice::query();
        if ($request->term) {
            $query->where('term', $request->term);
        }

        $summary = $query->select(
            'term',
            DB::raw('COUNT(*) as total_invoices'),
            DB::raw('SUM(total_amount) as total_invoiced'),
            DB::raw('SUM(amount_paid) as total_collected'),
            DB::raw('SUM(balance) as total_outstanding'),
            DB::raw('COUNT(CASE WHEN status = \'paid\' THEN 1 END) as paid_count'),
            DB::raw('COUNT(CASE WHEN status = \'partial\' THEN 1 END) as partial_count'),
            DB::raw('COUNT(CASE WHEN status = \'unpaid\' THEN 1 END) as unpaid_count')
        )->groupBy('term')->orderBy('term')->get();

        return response()->json($summary);
    }

    // Debtors list - students with outstanding balances
    public function debtors(Request $request)
    {
        $query = FeeInvoice::with('student')
            ->where('balance', '>', 0)
            ->where('status', '!=', 'paid');

        if ($request->term) {
            $query->where('term', $request->term);
        }

        if ($request->min_balance) {
            $query->where('balance', '>=', $request->min_balance);
        }

        $debtors = $query->orderBy('balance', 'desc')
            ->paginate(20)
            ->through(fn($invoice) => [
                'student_id'     => $invoice->student_id,
                'student_name'   => $invoice->student->first_name . ' ' . $invoice->student->last_name,
                'student_number' => $invoice->student->student_number,
                'parent_phone'   => $invoice->student->parent_phone,
                'term'           => $invoice->term,
                'total_amount'   => $invoice->total_amount,
                'amount_paid'    => $invoice->amount_paid,
                'balance'        => $invoice->balance,
                'due_date'       => $invoice->due_date,
                'status'         => $invoice->status,
            ]);

        return response()->json($debtors);
    }

    // Payroll summary by month
    public function payrollSummary(Request $request)
    {
        $request->validate([
            'month' => 'required|string',
        ]);

        $records = Payroll::with('staff')
            ->where('month', $request->month)
            ->get();

        $summary = [
            'month'          => $request->month,
            'total_staff'    => $records->count(),
            'total_basic'    => $records->sum('basic_salary'),
            'total_allowances' => $records->sum('allowances'),
            'total_deductions' => $records->sum('deductions'),
            'total_net'      => $records->sum('net_salary'),
            'paid_count'     => $records->where('status', 'paid')->count(),
            'pending_count'  => $records->where('status', 'pending')->count(),
            'records'        => $records->map(fn($p) => [
                'staff_name'   => $p->staff->first_name . ' ' . $p->staff->last_name,
                'staff_number' => $p->staff->staff_number,
                'role'         => $p->staff->role,
                'basic_salary' => $p->basic_salary,
                'allowances'   => $p->allowances,
                'deductions'   => $p->deductions,
                'net_salary'   => $p->net_salary,
                'status'       => $p->status,
            ]),
        ];

        return response()->json($summary);
    }

    // Collections by payment method
    public function collectionsByMethod(Request $request)
    {
        $query = Payment::where('status', 'confirmed');

        if ($request->date_from) {
            $query->whereDate('paid_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('paid_at', '<=', $request->date_to);
        }

        $data = $query->select(
            'method',
            DB::raw('COUNT(*) as transaction_count'),
            DB::raw('SUM(amount) as total_amount')
        )->groupBy('method')->orderBy('total_amount', 'desc')->get();

        return response()->json($data);
    }
}