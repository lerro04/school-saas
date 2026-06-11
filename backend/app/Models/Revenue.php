<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Revenue extends Model
{
    protected $fillable = [
        'reference_number', 'source', 'amount', 'student_id',
        'description', 'payment_method', 'transaction_reference',
        'received_by', 'status', 'revenue_date', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'revenue_date' => 'date',
    ];

    protected static function booted()
    {
        static::saved(function (Revenue $revenue) {
            FinancialTransaction::updateOrCreate(
                [
                    'source_type' => self::class,
                    'source_id' => $revenue->id,
                ],
                [
                    'transaction_type' => 'income',
                    'reference_number' => $revenue->reference_number,
                    'category' => $revenue->source,
                    'description' => $revenue->description,
                    'amount' => $revenue->amount,
                    'payment_method' => $revenue->payment_method,
                    'transaction_reference' => $revenue->transaction_reference,
                    'status' => $revenue->status,
                    'occurred_on' => $revenue->revenue_date,
                    'recorded_by' => $revenue->received_by,
                    'notes' => $revenue->notes,
                ]
            );
        });

        static::deleted(function (Revenue $revenue) {
            FinancialTransaction::where('source_type', self::class)
                ->where('source_id', $revenue->id)
                ->delete();
        });
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(Staff::class, 'received_by');
    }

    public function financialTransaction()
    {
        return $this->morphOne(FinancialTransaction::class, 'source');
    }
}
