<?php
namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\FeeInvoice;
use App\Models\Assignment;
use App\Models\Submission;
use App\Models\Result;
use App\Models\Announcement;
use App\Services\PaynowService;
use Illuminate\Http\Request;

class StudentPortalController extends Controller
{
    public function dashboard(Request $request)
{
    $studentId = $request->user()->reference_id;

    $fees = FeeInvoice::where('student_id', $studentId)
        ->select('id', 'total_amount', 'amount_paid', 'balance', 'status', 'term', 'invoice_number')
        ->get();

    $hasOutstanding = $fees->where('status', '!=', 'paid')->count() > 0;

    $assignments = Assignment::whereHas('schoolClass.students', function($q) use ($studentId) {
        $q->where('students.id', $studentId);
    })->where('is_published', true)
      ->where('due_date', '>=', now())
      ->orderBy('due_date')
      ->limit(5)
      ->get();

    // Only return results if no outstanding fees
    $results = [];
    $resultsLocked = false;

    if ($hasOutstanding) {
        $resultsLocked = true;
        // Return count only, no actual marks
        $results = Result::where('student_id', $studentId)
            ->select('id', 'subject', 'term', 'academic_year')
            ->get()
            ->map(fn($r) => [
                'id'            => $r->id,
                'subject'       => $r->subject,
                'term'          => $r->term,
                'academic_year' => $r->academic_year,
                'score'         => null,
                'grade'         => null,
                'remarks'       => null,
            ]);
    } else {
        $results = Result::where('student_id', $studentId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }

    $announcements = Announcement::where('is_published', true)
        ->whereIn('audience', ['all', 'students'])
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

    return response()->json([
        'fees'            => $fees,
        'total_balance'   => $fees->sum('balance'),
        'assignments'     => $assignments,
        'results'         => $results,
        'results_locked'  => $resultsLocked,
        'announcements'   => $announcements,
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