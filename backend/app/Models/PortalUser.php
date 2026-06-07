<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class PortalUser extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['name', 'email', 'password', 'role', 'reference_id'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['password' => 'hashed'];

    public function getReference()
    {
        return match($this->role) {
            'student' => Student::find($this->reference_id),
            'teacher' => Staff::find($this->reference_id),
            'parent'  => Student::find($this->reference_id),
            default   => null,
        };
    }
}