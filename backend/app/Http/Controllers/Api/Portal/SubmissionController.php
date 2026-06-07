<?php
namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\Submission;
use App\Models\Assignment;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function index(Request $request)
    {
        $query = Submission::with(['student', 'assignment']);
        if ($request->assignment_id) $query->where('assignment_id', $request->assignment_id);
        if ($request->student_id)    $query->where('student_id', $request->student_id);
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'assignment_id' => 'required|exists:assignments,id',
            'notes'         => 'nullable|string',
            'file'          => 'nullable|file|mimes:pdf,doc,docx,png,jpg,zip|max:10240',
        ]);

        $user      = $request->user();
        $studentId = $user->reference_id;

        $existing = Submission::where('assignment_id', $data['assignment_id'])
            ->where('student_id', $studentId)->first();

        if ($existing) {
            return response()->json(['message' => 'Already submitted'], 422);
        }

        $assignment = Assignment::findOrFail($data['assignment_id']);
        $isLate     = now()->isAfter($assignment->due_date);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('submissions', 'public');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
        }

        $data['student_id']   = $studentId;
        $data['submitted_at'] = now();
        $data['status']       = $isLate ? 'late' : 'submitted';

        unset($data['file']);
        $submission = Submission::create($data);

        return response()->json($submission->load(['student', 'assignment']), 201);
    }

    public function show($id)
    {
        return response()->json(Submission::with(['student', 'assignment'])->findOrFail($id));
    }

    // Teacher grades a submission
    public function grade(Request $request, $id)
    {
        $submission = Submission::findOrFail($id);
        $data = $request->validate([
            'marks_awarded'    => 'required|integer|min:0',
            'teacher_feedback' => 'nullable|string',
        ]);
        $data['status'] = 'graded';
        $submission->update($data);
        return response()->json($submission->load('student'));
    }

    public function update(Request $request, $id) {}
    public function destroy($id) {}
}