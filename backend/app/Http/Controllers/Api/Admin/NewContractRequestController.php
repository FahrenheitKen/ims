<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\NewContractRequest;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewContractRequestController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = NewContractRequest::with(['investor', 'reviewer'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('investor_id')) {
            $query->where('investor_id', $request->investor_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function approve(Request $request, NewContractRequest $newContractRequest): JsonResponse
    {
        if ($newContractRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending'], 422);
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        $contract = $this->investmentService->createNewContract(
            $newContractRequest->investor,
            (float) $newContractRequest->amount,
            now()->toDateString(),
            null
        );

        $newContractRequest->update([
            'status' => 'approved',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityService::log(
            $request->user()->id,
            $newContractRequest->investor_id,
            'new_contract_request_approved',
            "New contract request of {$newContractRequest->amount} approved — contract {$contract->contract_id} created"
        );

        return response()->json($newContractRequest->fresh(['investor', 'reviewer']));
    }

    public function reject(Request $request, NewContractRequest $newContractRequest): JsonResponse
    {
        if ($newContractRequest->status !== 'pending') {
            return response()->json(['message' => 'Request is not pending'], 422);
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:500',
        ]);

        $newContractRequest->update([
            'status' => 'rejected',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        ActivityService::log(
            $request->user()->id,
            $newContractRequest->investor_id,
            'new_contract_request_rejected',
            "New contract request of {$newContractRequest->amount} rejected"
        );

        return response()->json($newContractRequest->fresh(['investor', 'reviewer']));
    }
}
