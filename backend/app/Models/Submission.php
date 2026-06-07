<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'assignment_id', 'student_id', 'notes', 'file_path',
        'file_name', 'marks_awarded', 'teacher_feedback', 'status', 'submitted_at',
    ];

    protected $casts = ['submitted_at' => 'datetime'];

    public function assignment() { return $this->belongsTo(Assignment::class); }
    public function student() { return $this->belongsTo(Student::class); }
}