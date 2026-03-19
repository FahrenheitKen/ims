<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopUpController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    public function store(Request $request, Investor $investor): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:50000',
            'date' => 'nullable|date',
            'note' => 'nullable|string|max:500',
        ]);

        $this->investmentService->processTopUp(
            $investor,
            $validated['amount'],
            $validated['date'] ?? now()->toDateString(),
            $validated['note'] ?? null
        );

        ActivityService::log(
            $request->user()->id,
            $investor->id,
            'topup',
            "Top up of {$validated['amount']}. New total: {$investor->fresh()->total_invested}"
        );

        return response()->json($investor->fresh());
    }
}
