<?php
namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\FeeInvoice;
use App\Models\Result;
use App\Models\Assignment;
use App\Models\Announcement;
use App\Models\Student;
use App\Services\PaynowService;
use Illuminate\Http\Request;

class ParentPortalController extends Controller
{
    public function dashboard(Request $request)
    {
        $studentId = $request->user()->reference_id;
        $student   = Student::findOrFail($studentId);

        $fees = FeeInvoice::where('student_id', $studentId)
            ->orderBy('created_at', 'desc')->get();

        $results = Result::where('student_id', $studentId)
            ->orderBy('created_at', 'desc')->limit(10)->get();

        $announcements = Announcement::where('is_published', true)
            ->whereIn('audience', ['all', 'parents'])
            ->orderBy('created_at', 'desc')->limit(5)->get();

        return response()->json([
            'child'         => $student,
            'fees'          => $fees,
            'total_balance' => $fees->sum('balance'),
            'results'       => $results,
            'announcements' => $announcements,
        ]);
    }

    public function payFees(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:fee_invoices,id',
            'phone'      => 'required|string',
            'method'     => 'required|in:ecocash,onemoney,webpayment',
        ]);

        $studentId = $request->user()->reference_id;
        $invoice   = FeeInvoice::where('id', $request->invoice_id)
            ->where('student_id', $studentId)
            ->firstOrFail();

        $paynow = new PaynowService();
        $result = $paynow->initiatePayment(
            $invoice,
            $request->user()->email,
            $request->phone,
            $request->input('method')
        );

        if (!$result['success']) {
            return response()->json(['message' => $result['error']], 422);
        }

        $invoice->update(['poll_url' => $result['poll_url']]);

        return response()->json([
            'message'      => 'Payment initiated',
            'poll_url'     => $result['poll_url'],
            'instructions' => $result['instructions'] ?? null,
        ]);
    }
}