<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeInvoice;
use App\Models\Student;
use Illuminate\Http\Request;

class FeeInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeInvoice::with('student');

        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->term) {
            $query->where('term', $request->term);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'term'          => 'required|string|max:50',
            'tuition_fee'   => 'required|numeric|min:0',
            'boarding_fee'  => 'nullable|numeric|min:0',
            'activity_fee'  => 'nullable|numeric|min:0',
            'due_date'      => 'required|date',
        ]);

        $data['boarding_fee']  = $data['boarding_fee'] ?? 0;
        $data['activity_fee']  = $data['activity_fee'] ?? 0;
        $data['total_amount']  = $data['tuition_fee'] + $data['boarding_fee'] + $data['activity_fee'];
        $data['amount_paid']   = 0;
        $data['balance']       = $data['total_amount'];
        $data['status']        = 'unpaid';
        $data['invoice_number'] = $this->generateInvoiceNumber();

        $invoice = FeeInvoice::create($data);

        return response()->json($invoice->load('student'), 201);
    }

    public function show($id)
    {
        $invoice = FeeInvoice::with(['student', 'payments'])->findOrFail($id);
        return response()->json($invoice);
    }

    public function update(Request $request, $id)
    {
        $invoice = FeeInvoice::findOrFail($id);

        $data = $request->validate([
            'tuition_fee'  => 'sometimes|numeric|min:0',
            'boarding_fee' => 'sometimes|numeric|min:0',
            'activity_fee' => 'sometimes|numeric|min:0',
            'due_date'     => 'sometimes|date',
        ]);

        if (isset($data['tuition_fee']) || isset($data['boarding_fee']) || isset($data['activity_fee'])) {
            $tuition  = $data['tuition_fee']  ?? $invoice->tuition_fee;
            $boarding = $data['boarding_fee'] ?? $invoice->boarding_fee;
            $activity = $data['activity_fee'] ?? $invoice->activity_fee;

            $data['total_amount'] = $tuition + $boarding + $activity;
            $data['balance']      = $data['total_amount'] - $invoice->amount_paid;
        }

        $invoice->update($data);

        return response()->json($invoice->load('student'));
    }

    public function destroy($id)
    {
        $invoice = FeeInvoice::findOrFail($id);
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    // Bulk create invoices for all students in a class or entire school
    public function bulkCreate(Request $request)
    {
        $request->validate([
            'term'         => 'required|string|max:50',
            'tuition_fee'  => 'required|numeric|min:0',
            'boarding_fee' => 'nullable|numeric|min:0',
            'activity_fee' => 'nullable|numeric|min:0',
            'due_date'     => 'required|date',
            'class_id'     => 'nullable|exists:classes,id',
            'level'        => 'nullable|string|max:100',
        ]);

        $query = Student::where('status', 'active');
        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->level) {
            $query->whereHas('schoolClass', function ($q) use ($request) {
                $q->where('level', $request->level);
            });
        }

        $students = $query->get();
        $count = 0;

        foreach ($students as $student) {
            $exists = FeeInvoice::where('student_id', $student->id)
                ->where('term', $request->term)->exists();

            if (!$exists) {
                $total = $request->tuition_fee + ($request->boarding_fee ?? 0) + ($request->activity_fee ?? 0);
                FeeInvoice::create([
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'student_id'     => $student->id,
                    'term'           => $request->term,
                    'tuition_fee'    => $request->tuition_fee,
                    'boarding_fee'   => $request->boarding_fee ?? 0,
                    'activity_fee'   => $request->activity_fee ?? 0,
                    'total_amount'   => $total,
                    'amount_paid'    => 0,
                    'balance'        => $total,
                    'status'         => 'unpaid',
                    'due_date'       => $request->due_date,
                ]);
                $count++;
            }
        }

        return response()->json(['message' => "{$count} invoices created successfully"]);
    }

    private function generateInvoiceNumber()
    {
        $year = date('Y');
        $last = FeeInvoice::where('invoice_number', 'like', "INV{$year}%")
            ->orderBy('invoice_number', 'desc')->first();
        $next = $last ? (intval(substr($last->invoice_number, 7)) + 1) : 1;
        return "INV{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
