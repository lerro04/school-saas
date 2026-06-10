<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'item_code', 'name', 'category', 'unit', 'quantity_in_stock',
        'reorder_level', 'unit_cost', 'supplier_name', 'supplier_contact',
        'location', 'last_restocked_date', 'description', 'status',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'last_restocked_date' => 'date',
    ];

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'item_id');
    }

    public function getTotalValueAttribute()
    {
        return $this->quantity_in_stock * $this->unit_cost;
    }

    public function isLowStock()
    {
        return $this->quantity_in_stock <= $this->reorder_level;
    }
}
