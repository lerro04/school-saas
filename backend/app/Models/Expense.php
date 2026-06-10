<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'reference_number', 'category', 'amount', 'vendor_name',
        'description', 'expense_date', 'payment_method', 'receipt_number',
        'approved_by', 'status', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
    ];

    public function approvedBy()
    {
        return $this->belongsTo(Staff::class, 'approved_by');
    }
}
