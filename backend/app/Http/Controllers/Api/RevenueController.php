<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Revenue;
use Illuminate\Http\Request;

class RevenueController extends Controller
{
    public function index(Request $request)
    {
        $query = Revenue::with(['student', 'receivedBy']);

        if ($request->source) {
            $query->where('source', $request->source);
        }

        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->date_from) {
            $query->whereDate('revenue_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('revenue_date', '<=', $request->date_to);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $revenues = $query->orderBy('revenue_date', 'desc')->paginate(20);

        return response()->json($revenues);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'source'                  => 'required|in:tuition,activity,exam,transport,uniform,lunch,donation,other',
            'amount'                  => 'required|numeric|min:0.01',
            'student_id'              => 'nullable|exists:students,id',
            'description'             => 'nullable|string|max:500',
            'payment_method'          => 'nullable|in:cash,ecocash,zikit,bank_transfer,paynow',
            'transaction_reference'   => 'nullable|string|max:100',
            'revenue_date'            => 'nullable|date',
            'notes'                   => 'nullable|string',
        ]);

        $data['received_by']      = auth()->user()->id;
        $data['status']           = 'confirmed';
        $data['revenue_date']     = $data['revenue_date'] ?? now()->date();
        $data['reference_number'] = $this->generateReferenceNumber();

        $revenue = Revenue::create($data);

        return response()->json([
            'revenue'            => $revenue->load(['student', 'receivedBy']),
            'reference_number'   => $revenue->reference_number,
        ], 201);
    }

    public function show($id)
    {
        $revenue = Revenue::with(['student', 'receivedBy'])->findOrFail($id);
        return response()->json($revenue);
    }

    public function update(Request $request, $id)
    {
        $revenue = Revenue::findOrFail($id);

        $data = $request->validate([
            'source'                  => 'nullable|in:tuition,activity,exam,transport,uniform,lunch,donation,other',
            'amount'                  => 'nullable|numeric|min:0.01',
            'student_id'              => 'nullable|exists:students,id',
            'description'             => 'nullable|string|max:500',
            'payment_method'          => 'nullable|in:cash,ecocash,zikit,bank_transfer,paynow',
            'transaction_reference'   => 'nullable|string|max:100',
            'revenue_date'            => 'nullable|date',
            'status'                  => 'nullable|in:pending,confirmed,failed,reversed',
            'notes'                   => 'nullable|string',
        ]);

        $revenue->update(array_filter($data));

        return response()->json($revenue->load(['student', 'receivedBy']));
    }

    public function destroy($id)
    {
        $revenue = Revenue::findOrFail($id);
        $revenue->delete();

        return response()->json(['message' => 'Revenue deleted successfully']);
    }

    private function generateReferenceNumber()
    {
        $year = date('Y');
        $last = Revenue::where('reference_number', 'like', "REV{$year}%")
            ->orderBy('reference_number', 'desc')->first();
        $next = $last ? (intval(substr($last->reference_number, 7)) + 1) : 1;
        return "REV{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
