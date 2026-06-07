<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    protected $fillable = [
        'title', 'description', 'class_id', 'teacher_id', 'subject',
        'type', 'due_date', 'total_marks', 'attachment_path',
        'attachment_name', 'is_published',
    ];

    protected $casts = ['due_date' => 'date', 'is_published' => 'boolean'];

    public function schoolClass() { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function teacher() { return $this->belongsTo(Staff::class, 'teacher_id'); }
    public function submissions() { return $this->hasMany(Submission::class); }
}