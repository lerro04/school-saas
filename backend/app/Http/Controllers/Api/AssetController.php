<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $query = Asset::query();

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->location) {
            $query->where('location', $request->location);
        }

        if ($request->condition) {
            $query->where('condition', $request->condition);
        }

        $assets = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($assets);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:200',
            'category'           => 'required|string|max:100',
            'description'        => 'nullable|string|max:500',
            'purchase_price'     => 'required|numeric|min:0.01',
            'current_value'      => 'required|numeric|min:0',
            'purchase_date'      => 'required|date',
            'location'           => 'nullable|string|max:100',
            'condition'          => 'nullable|in:excellent,good,fair,poor',
            'status'             => 'nullable|in:active,inactive,disposed,lost',
            'supplier_name'      => 'nullable|string|max:200',
            'warranty_info'      => 'nullable|string|max:200',
            'warranty_expiry'    => 'nullable|date',
            'notes'              => 'nullable|string',
        ]);

        $data['asset_code'] = $this->generateAssetCode();
        $data['condition'] = $data['condition'] ?? 'good';
        $data['status'] = $data['status'] ?? 'active';

        $asset = Asset::create($data);

        return response()->json([
            'asset' => $asset,
            'asset_code' => $asset->asset_code,
        ], 201);
    }

    public function show($id)
    {
        $asset = Asset::findOrFail($id);
        return response()->json($asset);
    }

    public function update(Request $request, $id)
    {
        $asset = Asset::findOrFail($id);

        $data = $request->validate([
            'name'               => 'nullable|string|max:200',
            'category'           => 'nullable|string|max:100',
            'description'        => 'nullable|string|max:500',
            'purchase_price'     => 'nullable|numeric|min:0.01',
            'current_value'      => 'nullable|numeric|min:0',
            'purchase_date'      => 'nullable|date',
            'location'           => 'nullable|string|max:100',
            'condition'          => 'nullable|in:excellent,good,fair,poor',
            'status'             => 'nullable|in:active,inactive,disposed,lost',
            'supplier_name'      => 'nullable|string|max:200',
            'warranty_info'      => 'nullable|string|max:200',
            'warranty_expiry'    => 'nullable|date',
            'notes'              => 'nullable|string',
        ]);

        $asset->update(array_filter($data));

        return response()->json($asset);
    }

    public function destroy($id)
    {
        $asset = Asset::findOrFail($id);
        $asset->delete();

        return response()->json(['message' => 'Asset deleted successfully']);
    }

    public function summary(Request $request)
    {
        $query = Asset::where('status', 'active');

        if ($request->category) {
            $query->where('category', $request->category);
        }

        $assets = $query->get();

        $totalPurchaseValue = $assets->sum('purchase_price');
        $totalCurrentValue = $assets->sum('current_value');
        $totalDepreciation = $totalPurchaseValue - $totalCurrentValue;

        return response()->json([
            'total_assets'      => $assets->count(),
            'total_purchase_value' => $totalPurchaseValue,
            'total_current_value'  => $totalCurrentValue,
            'total_depreciation'   => $totalDepreciation,
            'depreciation_percentage' => $totalPurchaseValue > 0
                ? round(($totalDepreciation / $totalPurchaseValue) * 100, 2)
                : 0,
            'by_category'       => $assets->groupBy('category')
                ->map(fn($group) => [
                    'count' => $group->count(),
                    'purchase_value' => $group->sum('purchase_price'),
                    'current_value'  => $group->sum('current_value'),
                ]),
            'by_condition'      => $assets->groupBy('condition')
                ->map(fn($group) => $group->count()),
        ]);
    }

    private function generateAssetCode()
    {
        $year = date('Y');
        $last = Asset::where('asset_code', 'like', "AST{$year}%")
            ->orderBy('asset_code', 'desc')->first();
        $next = $last ? (intval(substr($last->asset_code, 7)) + 1) : 1;
        return "AST{$year}" . str_pad($next, 5, '0', STR_PAD_LEFT);
    }
}
