<?php
namespace App\Http\Controllers\Api\Portal;

use Illuminate\Routing\Controller;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Assignment::with(['schoolClass', 'teacher'])
            ->where('is_published', true);

        if ($request->class_id) $query->where('class_id', $request->class_id);
        if ($request->type)     $query->where('type', $request->type);

        return response()->json($query->orderBy('due_date')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string',
            'class_id'    => 'required|exists:classes,id',
            'subject'     => 'required|string|max:100',
            'type'        => 'required|in:assignment,homework,test,project',
            'due_date'    => 'required|date',
            'total_marks' => 'required|integer|min:1',
            'attachment'  => 'nullable|file|mimes:pdf,doc,docx,png,jpg,zip|max:10240',
        ]);

        $user = $request->user();
        $data['teacher_id'] = $user->reference_id;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('assignments', 'public');
            $data['attachment_path'] = $path;
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        unset($data['attachment']);
        $assignment = Assignment::create($data);

        return response()->json($assignment->load(['schoolClass', 'teacher']), 201);
    }

    public function show($id)
    {
        $assignment = Assignment::with(['schoolClass', 'teacher', 'submissions'])->findOrFail($id);
        return response()->json($assignment);
    }

    public function update(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);
        $data = $request->validate([
            'title'        => 'sometimes|string|max:255',
            'description'  => 'sometimes|string',
            'due_date'     => 'sometimes|date',
            'total_marks'  => 'sometimes|integer|min:1',
            'is_published' => 'sometimes|boolean',
        ]);
        $assignment->update($data);
        return response()->json($assignment);
    }

    public function destroy($id)
    {
        Assignment::findOrFail($id)->delete();
        return response()->json(['message' => 'Assignment deleted']);
    }
}