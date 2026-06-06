<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Students
            'view students', 'create students', 'edit students', 'delete students',
            // Fees
            'view fees', 'create fees', 'edit fees', 'delete fees',
            // Payments
            'view payments', 'create payments', 'edit payments',
            // Staff
            'view staff', 'create staff', 'edit staff', 'delete staff',
            // Payroll
            'view payroll', 'create payroll', 'edit payroll',
            // Results
            'view results', 'create results', 'edit results',
            // Reports
            'view reports',
            // Settings
            'manage settings',
            // Tenants (super admin only)
            'manage tenants',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Super Admin - manages everything across all schools
        Role::create(['name' => 'super-admin']);

        // School Admin - manages everything within their school
        $schoolAdmin = Role::create(['name' => 'school-admin']);
        $schoolAdmin->givePermissionTo(Permission::all()->except('manage tenants'));

        // Bursar - manages fees and payments
        $bursar = Role::create(['name' => 'bursar']);
        $bursar->givePermissionTo([
            'view students', 'view fees', 'create fees', 'edit fees',
            'view payments', 'create payments', 'edit payments', 'view reports',
        ]);

        // Teacher - manages results and views students
        $teacher = Role::create(['name' => 'teacher']);
        $teacher->givePermissionTo([
            'view students', 'view results', 'create results', 'edit results',
        ]);

        // Parent - views their child's info
        $parent = Role::create(['name' => 'parent']);
        $parent->givePermissionTo([
            'view students', 'view fees', 'view payments', 'view results',
        ]);

        // Student - views own info only
        $student = Role::create(['name' => 'student']);
        $student->givePermissionTo([
            'view results', 'view fees',
        ]);
    }
}