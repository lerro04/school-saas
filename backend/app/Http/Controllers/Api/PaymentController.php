<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\FeeInvoice;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['student', 'invoice']);

        if ($request->student_id) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->method) {
            $query->where('method', $request->method);
        }

        if ($request->date_from) {
            $query->whereDate('paid_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('paid_at', '<=', $request->date_to);
        }

        $payments = $query->orderBy('paid_at', 'desc')->paginate(20);

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_id'            => 'required|exists:fee_invoices,id',
            'amount'                => 'required|numeric|min:0.01',
            'method'                => 'required|in:cash,ecocash,zipit,bank_transfer,paynow',
            'transaction_reference' => 'nullable|string|max:100',
            'notes'                 => 'nullable|string',
            'paid_at'               => 'nullable|date',
        ]);

        $invoice = FeeInvoice::findOrFail($data['invoice_id']);

        // Don't allow overpayment
        if ($data['amount'] > $invoice->balance) {
            return response()->json([
                'message' => "Amount exceeds balance. Outstanding balance is {$invoice->balance}"
            ], 422);
        }

        $data['student_id']     = $invoice->student_id;
        $data['received_by']    = auth()->user()->id;
        $data['paid_at']        = $data['paid_at'] ?? now();
        $data['status']         = 'confirmed';
        $data['receipt_number'] = $this->generateReceiptNumber();

        $payment = Payment::create($data);

        // Update invoice balance
        $newAmountPaid = $invoice->amount_paid + $data['amount'];
        $newBalance    = $invoice->total_amount - $newAmountPaid;
        $newStatus     = $newBalance <= 0 ? 'paid' : 'partial';

        $invoice->update([
            'amount_paid' => $newAmountPaid,
            'balance'     => $newBalance,
            'status'      => $newStatus,
        ]);

        return response()->json([
            'payment'        => $payment->load(['student', 'invoice']),
            'receipt_number' => $payment->receipt_number,
            'invoice_status' => $newStatus,
            'new_balance'    => $newBalance,
        ], 201);
    }

    public function show($id)
    {
        $payment = Payment::with(['student', 'invoice', 'receivedBy'])->findOrFail($id);
        return response()->json($payment);
    }

    public function update(Request $request, $id) {}

    public function destroy($id) {}

    private function generateReceiptNumber()
    {
        $year = date('Y');
        $last = Payment::where('receipt_number', 'like', "RCP{$year}%")
            ->orderBy('receipt_number', 'desc')->first();
        $next = $last ? (intval(substr($last->receipt_number, 7)) + 1) : 1;
        return "RCP{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}