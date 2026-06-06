<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        $query = Staff::query();

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name', 'like', "%{$request->search}%")
                  ->orWhere('staff_number', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('last_name')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'email'        => 'required|email|unique:staff,email',
            'phone'        => 'required|string|max:20',
            'role'         => 'required|in:teacher,bursar,admin,headmaster,support',
            'subject'      => 'nullable|string|max:100',
            'hire_date'    => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'create_login' => 'boolean',
            'password'     => 'required_if:create_login,true|nullable|string|min:8',
        ]);

        $data['staff_number'] = $this->generateStaffNumber();

        // Create login account if requested
        if ($request->create_login) {
            $user = User::create([
                'name'     => $data['first_name'] . ' ' . $data['last_name'],
                'email'    => $data['email'],
                'password' => Hash::make($request->password),
            ]);
            $user->assignRole($data['role'] === 'bursar' ? 'bursar' : 'teacher');
            $data['user_id'] = $user->id;
        }

        unset($data['create_login'], $data['password']);
        $staff = Staff::create($data);

        return response()->json($staff, 201);
    }

    public function show($id)
    {
        $staff = Staff::with(['classes', 'payrolls'])->findOrFail($id);
        return response()->json($staff);
    }

    public function update(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);

        $data = $request->validate([
            'first_name'   => 'sometimes|string|max:255',
            'last_name'    => 'sometimes|string|max:255',
            'email'        => 'sometimes|email|unique:staff,email,' . $id,
            'phone'        => 'sometimes|string|max:20',
            'role'         => 'sometimes|in:teacher,bursar,admin,headmaster,support',
            'subject'      => 'nullable|string|max:100',
            'hire_date'    => 'sometimes|date',
            'basic_salary' => 'sometimes|numeric|min:0',
            'status'       => 'sometimes|in:active,on_leave,terminated',
        ]);

        $staff->update($data);

        return response()->json($staff);
    }

    public function destroy($id)
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();
        return response()->json(['message' => 'Staff member deleted successfully']);
    }

    private function generateStaffNumber()
    {
        $year = date('Y');
        $last = Staff::withTrashed()
            ->where('staff_number', 'like', "STF{$year}%")
            ->orderBy('staff_number', 'desc')
            ->first();
        $next = $last ? (intval(substr($last->staff_number, 7)) + 1) : 1;
        return "STF{$year}" . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}