<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $query = Budget::with(['approvedBy']);

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $budgets = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($budgets);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:200',
            'category'           => 'required|string|max:100',
            'allocated_amount'   => 'required|numeric|min:0.01',
            'start_date'         => 'required|date',
            'end_date'           => 'required|date|after:start_date',
            'description'        => 'nullable|string|max:500',
            'status'             => 'nullable|in:draft,approved,active,completed,suspended',
            'notes'              => 'nullable|string',
        ]);

        $data['status'] = $data['status'] ?? 'draft';

        $budget = Budget::create($data);

        return response()->json([
            'budget' => $budget->load(['approvedBy']),
        ], 201);
    }

    public function show($id)
    {
        $budget = Budget::with(['approvedBy'])->findOrFail($id);
        return response()->json($budget);
    }

    public function update(Request $request, $id)
    {
        $budget = Budget::findOrFail($id);

        $data = $request->validate([
            'name'               => 'nullable|string|max:200',
            'category'           => 'nullable|string|max:100',
            'allocated_amount'   => 'nullable|numeric|min:0.01',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date',
            'description'        => 'nullable|string|max:500',
            'status'             => 'nullable|in:draft,approved,active,completed,suspended',
            'notes'              => 'nullable|string',
        ]);

        if (isset($data['end_date']) && isset($data['start_date'])) {
            if ($data['end_date'] <= $data['start_date']) {
                return response()->json(['message' => 'End date must be after start date'], 422);
            }
        }

        $budget->update(array_filter($data));

        return response()->json($budget->load(['approvedBy']));
    }

    public function destroy($id)
    {
        $budget = Budget::findOrFail($id);
        $budget->delete();

        return response()->json(['message' => 'Budget deleted successfully']);
    }

    public function approveBulk(Request $request)
    {
        $data = $request->validate([
            'budget_ids' => 'required|array',
            'budget_ids.*' => 'exists:budgets,id',
        ]);

        Budget::whereIn('id', $data['budget_ids'])
            ->update(['status' => 'approved', 'approved_by' => auth()->user()->id]);

        return response()->json(['message' => 'Budgets approved successfully']);
    }

    public function updateSpending(Request $request, $id)
    {
        $budget = Budget::findOrFail($id);

        $data = $request->validate([
            'spent_amount' => 'required|numeric|min:0',
        ]);

        $budget->update(['spent_amount' => $data['spent_amount']]);

        return response()->json([
            'budget'               => $budget,
            'remaining'            => $budget->remaining,
            'utilization_percentage' => $budget->utilization_percentage,
        ]);
    }

    public function summary(Request $request)
    {
        $request->validate([
            'category' => 'nullable|string',
            'status'   => 'nullable|string',
        ]);

        $query = Budget::query();

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $budgets = $query->get();

        $totalAllocated = $budgets->sum('allocated_amount');
        $totalSpent = $budgets->sum('spent_amount');

        return response()->json([
            'total_allocated' => $totalAllocated,
            'total_spent'     => $totalSpent,
            'total_remaining' => $totalAllocated - $totalSpent,
            'utilization'     => $totalAllocated > 0 ? round(($totalSpent / $totalAllocated) * 100, 2) : 0,
            'budgets_count'   => $budgets->count(),
            'by_category'     => $budgets->groupBy('category')
                ->map(fn($group) => [
                    'allocated' => $group->sum('allocated_amount'),
                    'spent'     => $group->sum('spent_amount'),
                    'count'     => $group->count(),
                ]),
        ]);
    }
}
