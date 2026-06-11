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

    protected static function booted()
    {
        static::saved(function (Expense $expense) {
            FinancialTransaction::updateOrCreate(
                [
                    'source_type' => self::class,
                    'source_id' => $expense->id,
                ],
                [
                    'transaction_type' => 'expense',
                    'reference_number' => $expense->reference_number,
                    'category' => $expense->category,
                    'description' => $expense->description,
                    'amount' => $expense->amount,
                    'payment_method' => $expense->payment_method,
                    'transaction_reference' => $expense->receipt_number,
                    'status' => $expense->status,
                    'occurred_on' => $expense->expense_date,
                    'recorded_by' => $expense->approved_by,
                    'notes' => $expense->notes,
                ]
            );
        });

        static::deleted(function (Expense $expense) {
            FinancialTransaction::where('source_type', self::class)
                ->where('source_id', $expense->id)
                ->delete();
        });
    }

    public function approvedBy()
    {
        return $this->belongsTo(Staff::class, 'approved_by');
    }

    public function financialTransaction()
    {
        return $this->morphOne(FinancialTransaction::class, 'source');
    }
}
