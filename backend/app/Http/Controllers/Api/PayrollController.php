<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Staff;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $query = Payroll::with('staff');

        if ($request->month) {
            $query->where('month', $request->month);
        }

        if ($request->staff_id) {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'month' => 'required|string|max:20',
        ]);

        // Bulk generate payroll for all active staff
        $staff = Staff::where('status', 'active')->get();
        $count = 0;

        foreach ($staff as $member) {
            $exists = Payroll::where('staff_id', $member->id)
                ->where('month', $request->month)->exists();

            if (!$exists) {
                $allowances  = $request->allowances[$member->id] ?? 0;
                $deductions  = $request->deductions[$member->id] ?? 0;
                $net         = $member->basic_salary + $allowances - $deductions;

                Payroll::create([
                    'staff_id'     => $member->id,
                    'month'        => $request->month,
                    'basic_salary' => $member->basic_salary,
                    'allowances'   => $allowances,
                    'deductions'   => $deductions,
                    'net_salary'   => $net,
                    'status'       => 'pending',
                ]);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} payroll records generated for {$request->month}"], 201);
    }

    public function show($id)
    {
        $payroll = Payroll::with('staff')->findOrFail($id);
        return response()->json($payroll);
    }

    public function update(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        $data = $request->validate([
            'allowances'        => 'sometimes|numeric|min:0',
            'deductions'        => 'sometimes|numeric|min:0',
            'status'            => 'sometimes|in:pending,paid',
            'payment_date'      => 'nullable|date',
            'payment_reference' => 'nullable|string|max:100',
        ]);

        if (isset($data['allowances']) || isset($data['deductions'])) {
            $allowances = $data['allowances'] ?? $payroll->allowances;
            $deductions = $data['deductions'] ?? $payroll->deductions;
            $data['net_salary'] = $payroll->basic_salary + $allowances - $deductions;
        }

        $payroll->update($data);

        return response()->json($payroll->load('staff'));
    }

    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();
        return response()->json(['message' => 'Payroll record deleted']);
    }

    // Mark all payroll for a month as paid
    public function markPaid(Request $request)
    {
        $request->validate([
            'month'             => 'required|string',
            'payment_date'      => 'required|date',
            'payment_reference' => 'nullable|string',
        ]);

        $count = Payroll::where('month', $request->month)
            ->where('status', 'pending')
            ->update([
                'status'            => 'paid',
                'payment_date'      => $request->payment_date,
                'payment_reference' => $request->payment_reference,
            ]);

        return response()->json(['message' => "{$count} payroll records marked as paid"]);
    }
}