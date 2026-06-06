<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with('schoolClass');

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('student_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        $students = $query->orderBy('last_name')->paginate(20);

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'      => 'required|string|max:255',
            'last_name'       => 'required|string|max:255',
            'date_of_birth'   => 'required|date',
            'gender'          => 'required|in:male,female',
            'national_id'     => 'nullable|string|max:50',
            'class_id'        => 'nullable|exists:classes,id',
            'parent_name'     => 'required|string|max:255',
            'parent_phone'    => 'required|string|max:20',
            'parent_email'    => 'nullable|email',
            'address'         => 'nullable|string',
            'enrollment_date' => 'required|date',
        ]);

        $data['student_number'] = $this->generateStudentNumber();

        $student = Student::create($data);

        return response()->json($student->load('schoolClass'), 201);
    }

    public function show($id)
    {
        $student = Student::with(['schoolClass', 'feeInvoices', 'results'])->findOrFail($id);
        return response()->json($student);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);

        $data = $request->validate([
            'first_name'      => 'sometimes|string|max:255',
            'last_name'       => 'sometimes|string|max:255',
            'date_of_birth'   => 'sometimes|date',
            'gender'          => 'sometimes|in:male,female',
            'national_id'     => 'nullable|string|max:50',
            'class_id'        => 'nullable|exists:classes,id',
            'parent_name'     => 'sometimes|string|max:255',
            'parent_phone'    => 'sometimes|string|max:20',
            'parent_email'    => 'nullable|email',
            'address'         => 'nullable|string',
            'status'          => 'sometimes|in:active,transferred,graduated,suspended',
            'enrollment_date' => 'sometimes|date',
        ]);

        $student->update($data);

        return response()->json($student->load('schoolClass'));
    }

    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $student->delete();
        return response()->json(['message' => 'Student deleted successfully']);
    }

    private function generateStudentNumber()
    {
        $year = date('Y');
        $last = Student::withTrashed()
            ->where('student_number', 'like', "STU{$year}%")
            ->orderBy('student_number', 'desc')
            ->first();

        $next = $last ? (intval(substr($last->student_number, 7)) + 1) : 1;
        return "STU{$year}" . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}