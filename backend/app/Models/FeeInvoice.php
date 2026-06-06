<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeInvoice extends Model
{
    protected $fillable = [
        'invoice_number', 'student_id', 'term', 'tuition_fee',
        'boarding_fee', 'activity_fee', 'total_amount',
        'amount_paid', 'balance', 'status', 'due_date',
    ];

    protected $casts = [
        'due_date' => 'date',
        'tuition_fee' => 'decimal:2',
        'boarding_fee' => 'decimal:2',
        'activity_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'invoice_id');
    }
}