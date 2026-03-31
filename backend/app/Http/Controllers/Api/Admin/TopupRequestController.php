<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContractTopupRequest;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TopupRequestController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = ContractTopupRequest::with(['investor', 'contract', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function approve(Request $request, ContractTopupRequest $topupRequest): JsonResponse
    {
        if ($topupRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending'], 422);
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        $this->investmentService->processTopUp(
            $topupRequest->investor,
            (float) $topupRequest->amount,
            now()->toDateString(),
            $topupRequest->note,
            $topupRequest->contract
        );

        $topupRequest->update([
            'status' => 'approved',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityService::log(
            $request->user()->id,
            $topupRequest->investor_id,
            'topup_request_approved',
            "Topup request of {$topupRequest->amount} on contract {$topupRequest->contract->contract_id} approved"
        );

        return response()->json($topupRequest->fresh(['investor', 'contract', 'reviewer']));
    }

    public function reject(Request $request, ContractTopupRequest $topupRequest): JsonResponse
    {
        if ($topupRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending'], 422);
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        $topupRequest->update([
            'status' => 'rejected',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityService::log(
            $request->user()->id,
            $topupRequest->investor_id,
            'topup_request_rejected',
            "Topup request of {$topupRequest->amount} on contract {$topupRequest->contract->contract_id} rejected"
        );

        return response()->json($topupRequest->fresh(['investor', 'contract', 'reviewer']));
    }
}
