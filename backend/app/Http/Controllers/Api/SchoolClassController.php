<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function index(Request $request)
    {
        $classes = SchoolClass::query()
            ->with('teacher:id,first_name,last_name,staff_number')
            ->withCount('students')
            ->when($request->level, fn ($query) => $query->where('level', $request->level))
            ->when($request->academic_year, fn ($query) => $query->where('academic_year', $request->academic_year))
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return response()->json($classes);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:100',
            'level'         => 'required|string|max:100',
            'stream'        => 'nullable|string|max:50',
            'teacher_id'    => 'nullable|exists:staff,id',
            'capacity'      => 'required|integer|min:1|max:500',
            'academic_year' => 'required|string|max:20',
        ]);

        $class = SchoolClass::create($data);

        return response()->json($class->load('teacher')->loadCount('students'), 201);
    }

    public function show($id)
    {
        $class = SchoolClass::with(['teacher', 'students'])
            ->withCount('students')
            ->findOrFail($id);

        return response()->json($class);
    }

    public function update(Request $request, $id)
    {
        $class = SchoolClass::findOrFail($id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'level'         => 'sometimes|string|max:100',
            'stream'        => 'nullable|string|max:50',
            'teacher_id'    => 'nullable|exists:staff,id',
            'capacity'      => 'sometimes|integer|min:1|max:500',
            'academic_year' => 'sometimes|string|max:20',
        ]);

        $class->update($data);

        return response()->json($class->load('teacher')->loadCount('students'));
    }

    public function destroy($id)
    {
        $class = SchoolClass::withCount('students')->findOrFail($id);

        if ($class->students_count > 0) {
            return response()->json(['message' => 'Move students out of this class before deleting it.'], 422);
        }

        $class->delete();

        return response()->json(['message' => 'Class deleted successfully']);
    }
}
