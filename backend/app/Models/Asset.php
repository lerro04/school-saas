<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    protected $fillable = [
        'asset_code', 'name', 'category', 'description',
        'purchase_price', 'current_value', 'purchase_date',
        'location', 'condition', 'status', 'supplier_name',
        'warranty_info', 'warranty_expiry', 'notes',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'current_value' => 'decimal:2',
        'purchase_date' => 'date',
        'warranty_expiry' => 'date',
    ];

    public function getDepreciationAttribute()
    {
        return $this->purchase_price - $this->current_value;
    }

    public function getDepreciationPercentageAttribute()
    {
        return $this->purchase_price > 0
            ? round(($this->depreciation / $this->purchase_price) * 100, 2)
            : 0;
    }
}
