<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = [
        'name', 'category', 'allocated_amount', 'spent_amount',
        'start_date', 'end_date', 'description', 'status',
        'approved_by', 'notes',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function approvedBy()
    {
        return $this->belongsTo(Staff::class, 'approved_by');
    }

    public function getRemainingAttribute()
    {
        return $this->allocated_amount - $this->spent_amount;
    }

    public function getUtilizationPercentageAttribute()
    {
        return $this->allocated_amount > 0
            ? round(($this->spent_amount / $this->allocated_amount) * 100, 2)
            : 0;
    }
}
