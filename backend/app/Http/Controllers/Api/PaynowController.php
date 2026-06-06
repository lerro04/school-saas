<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeInvoice;
use App\Models\Payment;
use App\Services\PaynowService;
use Illuminate\Http\Request;

class PaynowController extends Controller
{
    protected PaynowService $paynow;

    public function __construct(PaynowService $paynow)
    {
        $this->paynow = $paynow;
    }

    // Initiate a Paynow payment
    public function initiate(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:fee_invoices,id',
            'email'      => 'required|email',
            'phone'      => 'required|string',
            'method'     => 'required|in:ecocash,onemoney,webpayment',
        ]);

        $invoice = FeeInvoice::with('student')->findOrFail($request->invoice_id);

        if ($invoice->balance <= 0) {
            return response()->json(['message' => 'Invoice is already fully paid'], 422);
        }

        $result = $this->paynow->initiatePayment(
    $invoice,
    $request->email,
    $request->phone,
    $request->input('method')  
);

        if (!$result['success']) {
            return response()->json(['message' => $result['error']], 422);
        }

        // Store poll_url on the invoice for status checking
        $invoice->update(['poll_url' => $result['poll_url']]);

        return response()->json([
            'message'      => 'Payment initiated successfully',
            'poll_url'     => $result['poll_url'],
            'redirect_url' => $result['redirect_url'] ?? null,
            'instructions' => $result['instructions'] ?? null,
        ]);
    }

    // Poll payment status
    public function poll(Request $request)
    {
        $request->validate([
            'poll_url'   => 'required|string',
            'invoice_id' => 'required|exists:fee_invoices,id',
        ]);

        $status = $this->paynow->pollStatus($request->poll_url);

        if ($status['paid']) {
            $invoice = FeeInvoice::findOrFail($request->invoice_id);

            // Avoid double recording
            $alreadyRecorded = Payment::where('invoice_id', $invoice->id)
                ->where('transaction_reference', $request->poll_url)
                ->exists();

            if (!$alreadyRecorded) {
                $amount = $status['amount'] ?? $invoice->balance;

                Payment::create([
                    'receipt_number'        => 'RCP' . date('Y') . str_pad(Payment::count() + 1, 5, '0', STR_PAD_LEFT),
                    'invoice_id'            => $invoice->id,
                    'student_id'            => $invoice->student_id,
                    'amount'                => $amount,
                    'method'                => 'paynow',
                    'transaction_reference' => $request->poll_url,
                    'status'                => 'confirmed',
                    'received_by'           => auth()->id(),
                    'paid_at'               => now(),
                ]);

                $newPaid    = $invoice->amount_paid + $amount;
                $newBalance = $invoice->total_amount - $newPaid;

                $invoice->update([
                    'amount_paid' => $newPaid,
                    'balance'     => max(0, $newBalance),
                    'status'      => $newBalance <= 0 ? 'paid' : 'partial',
                ]);
            }
        }

        return response()->json($status);
    }

    // Webhook from Paynow (called by Paynow servers)
    public function webhook(Request $request)
    {
        // Paynow sends status updates here
        // Log it for now — in production verify the hash
        \Log::info('Paynow webhook received', $request->all());

        return response('OK', 200);
    }
}