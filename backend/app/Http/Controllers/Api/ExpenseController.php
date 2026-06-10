<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with(['approvedBy']);

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->date_from) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->paginate(20);

        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category'         => 'required|in:salaries,utilities,maintenance,supplies,transport,food,equipment,rent,software,other',
            'amount'           => 'required|numeric|min:0.01',
            'vendor_name'      => 'nullable|string|max:100',
            'description'      => 'required|string|max:500',
            'expense_date'     => 'nullable|date',
            'payment_method'   => 'nullable|in:cash,cheque,bank_transfer,ecocash,paynow',
            'receipt_number'   => 'nullable|string|max:50',
            'status'           => 'nullable|in:pending,approved,paid,rejected',
            'notes'            => 'nullable|string',
        ]);

        $data['expense_date']      = $data['expense_date'] ?? now()->date();
        $data['reference_number']  = $this->generateReferenceNumber();
        $data['status']            = $data['status'] ?? 'pending';

        $expense = Expense::create($data);

        return response()->json([
            'expense'           => $expense->load(['approvedBy']),
            'reference_number'  => $expense->reference_number,
        ], 201);
    }

    public function show($id)
    {
        $expense = Expense::with(['approvedBy'])->findOrFail($id);
        return response()->json($expense);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $data = $request->validate([
            'category'         => 'nullable|in:salaries,utilities,maintenance,supplies,transport,food,equipment,rent,software,other',
            'amount'           => 'nullable|numeric|min:0.01',
            'vendor_name'      => 'nullable|string|max:100',
            'description'      => 'nullable|string|max:500',
            'expense_date'     => 'nullable|date',
            'payment_method'   => 'nullable|in:cash,cheque,bank_transfer,ecocash,paynow',
            'receipt_number'   => 'nullable|string|max:50',
            'approved_by'      => 'nullable|exists:staff,id',
            'status'           => 'nullable|in:pending,approved,paid,rejected',
            'notes'            => 'nullable|string',
        ]);

        $expense->update(array_filter($data));

        return response()->json($expense->load(['approvedBy']));
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }

    public function approveBulk(Request $request)
    {
        $data = $request->validate([
            'expense_ids' => 'required|array',
            'expense_ids.*' => 'exists:expenses,id',
        ]);

        Expense::whereIn('id', $data['expense_ids'])
            ->update(['status' => 'approved', 'approved_by' => auth()->user()->id]);

        return response()->json(['message' => 'Expenses approved successfully']);
    }

    private function generateReferenceNumber()
    {
        $year = date('Y');
        $last = Expense::where('reference_number', 'like', "EXP{$year}%")
            ->orderBy('reference_number', 'desc')->first();
        $next = $last ? (intval(substr($last->reference_number, 7)) + 1) : 1;
        return "EXP{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
