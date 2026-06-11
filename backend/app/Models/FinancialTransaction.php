<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialTransaction extends Model
{
    protected $fillable = [
        'transaction_type',
        'reference_number',
        'source_type',
        'source_id',
        'category',
        'description',
        'amount',
        'payment_method',
        'transaction_reference',
        'status',
        'occurred_on',
        'recorded_by',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'occurred_on' => 'date',
    ];

    public function source()
    {
        return $this->morphTo();
    }
}
