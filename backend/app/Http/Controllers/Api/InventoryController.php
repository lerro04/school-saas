<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query();

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->low_stock) {
            $query->whereRaw('quantity_in_stock <= reorder_level');
        }

        $items = $query->orderBy('name')->paginate(20);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:200',
            'category'           => 'required|string|max:100',
            'unit'               => 'required|string|max:50',
            'quantity_in_stock'  => 'required|integer|min:0',
            'reorder_level'      => 'required|integer|min:0',
            'unit_cost'          => 'required|numeric|min:0.01',
            'supplier_name'      => 'nullable|string|max:200',
            'supplier_contact'   => 'nullable|string|max:200',
            'location'           => 'nullable|string|max:100',
            'description'        => 'nullable|string|max:500',
            'status'             => 'nullable|in:active,discontinued',
        ]);

        $data['item_code'] = $this->generateItemCode();
        $data['status'] = $data['status'] ?? 'active';

        $item = InventoryItem::create($data);

        return response()->json([
            'item' => $item,
            'item_code' => $item->item_code,
        ], 201);
    }

    public function show($id)
    {
        $item = InventoryItem::with(['transactions.recordedBy'])->findOrFail($id);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = InventoryItem::findOrFail($id);

        $data = $request->validate([
            'name'               => 'nullable|string|max:200',
            'category'           => 'nullable|string|max:100',
            'unit'               => 'nullable|string|max:50',
            'reorder_level'      => 'nullable|integer|min:0',
            'unit_cost'          => 'nullable|numeric|min:0.01',
            'supplier_name'      => 'nullable|string|max:200',
            'supplier_contact'   => 'nullable|string|max:200',
            'location'           => 'nullable|string|max:100',
            'description'        => 'nullable|string|max:500',
            'status'             => 'nullable|in:active,discontinued',
        ]);

        $item->update(array_filter($data));

        return response()->json($item);
    }

    public function destroy($id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }

    public function restock(Request $request)
    {
        $data = $request->validate([
            'item_id'      => 'required|exists:inventory_items,id',
            'quantity'     => 'required|integer|min:1',
            'reference'    => 'nullable|string|max:100',
            'notes'        => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($data['item_id']);
        $item->increment('quantity_in_stock', $data['quantity']);
        $item->update(['last_restocked_date' => now()]);

        InventoryTransaction::create([
            'item_id'        => $data['item_id'],
            'type'           => 'in',
            'quantity'       => $data['quantity'],
            'reference'      => $data['reference'] ?? null,
            'recorded_by'    => auth()->user()->id,
            'notes'          => $data['notes'] ?? null,
            'transaction_date' => now(),
        ]);

        return response()->json([
            'message'      => 'Stock updated successfully',
            'new_quantity' => $item->quantity_in_stock,
        ]);
    }

    public function usageOut(Request $request)
    {
        $data = $request->validate([
            'item_id'      => 'required|exists:inventory_items,id',
            'quantity'     => 'required|integer|min:1',
            'reference'    => 'nullable|string|max:100',
            'notes'        => 'nullable|string',
        ]);

        $item = InventoryItem::findOrFail($data['item_id']);

        if ($item->quantity_in_stock < $data['quantity']) {
            return response()->json([
                'message' => 'Insufficient stock. Available: ' . $item->quantity_in_stock
            ], 422);
        }

        $item->decrement('quantity_in_stock', $data['quantity']);

        InventoryTransaction::create([
            'item_id'        => $data['item_id'],
            'type'           => 'out',
            'quantity'       => $data['quantity'],
            'reference'      => $data['reference'] ?? null,
            'recorded_by'    => auth()->user()->id,
            'notes'          => $data['notes'] ?? null,
            'transaction_date' => now(),
        ]);

        return response()->json([
            'message'      => 'Stock reduced successfully',
            'new_quantity' => $item->quantity_in_stock,
        ]);
    }

    public function summary()
    {
        $items = InventoryItem::where('status', 'active')->get();

        $lowStockItems = $items->filter(fn($item) => $item->isLowStock());
        $totalValue = $items->sum(fn($item) => $item->total_value);

        return response()->json([
            'total_items'       => $items->count(),
            'low_stock_count'   => $lowStockItems->count(),
            'total_inventory_value' => $totalValue,
            'by_category'       => $items->groupBy('category')
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'total_value' => $group->sum(fn($item) => $item->total_value),
                ]),
            'low_stock_items'   => $lowStockItems
                ->map(fn($item) => [
                    'id'              => $item->id,
                    'name'            => $item->name,
                    'quantity'        => $item->quantity_in_stock,
                    'reorder_level'   => $item->reorder_level,
                    'unit'            => $item->unit,
                ]),
        ]);
    }

    private function generateItemCode()
    {
        $year = date('Y');
        $last = InventoryItem::where('item_code', 'like', "INV{$year}%")
            ->orderBy('item_code', 'desc')->first();
        $next = $last ? (intval(substr($last->item_code, 7)) + 1) : 1;
        return "INV{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
