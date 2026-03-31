<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InvestmentPackage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvestmentPackageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(InvestmentPackage::orderBy('sort_order')->get());
    }

    /** Public endpoint — no auth required (used by landing page) */
    public function publicIndex(): JsonResponse
    {
        return response()->json(
            InvestmentPackage::where('is_active', true)->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'min_amount'    => 'required|numeric|min:0',
            'max_amount'    => 'nullable|numeric|gt:min_amount',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'features'      => 'nullable|array',
            'features.*'    => 'string|max:200',
            'is_active'     => 'boolean',
            'sort_order'    => 'integer',
        ]);

        $validated['interest_rate'] = $validated['interest_rate'] / 100;

        return response()->json(InvestmentPackage::create($validated), 201);
    }

    public function update(Request $request, InvestmentPackage $package): JsonResponse
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'min_amount'    => 'required|numeric|min:0',
            'max_amount'    => 'nullable|numeric|gt:min_amount',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'features'      => 'nullable|array',
            'features.*'    => 'string|max:200',
            'is_active'     => 'boolean',
            'sort_order'    => 'integer',
        ]);

        $validated['interest_rate'] = $validated['interest_rate'] / 100;

        $package->update($validated);
        return response()->json($package->fresh());
    }

    public function destroy(InvestmentPackage $package): JsonResponse
    {
        $package->delete();
        return response()->json(['message' => 'Package deleted']);
    }
}
