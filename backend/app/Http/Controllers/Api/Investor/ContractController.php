<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractTopupRequest;
use App\Models\NewContractRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $contracts = $investor->contracts()
            ->withCount('payoutSchedules')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($contracts);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $investor = $request->user('investor');

        $contract = $investor->contracts()
            ->with([
                'payoutSchedules' => function ($q) {
                    $q->orderBy('due_date')->with('paymentAllocations.payment');
                },
            ])
            ->findOrFail($id);

        $schedules = $contract->payoutSchedules;
        $totalExpected = $schedules->sum('expected_amount');
        $totalPaid = $schedules->sum('paid_amount');

        return response()->json([
            'contract' => $contract,
            'summary' => [
                'total_invested' => (float) $contract->total_invested,
                'interest_rate' => (float) $contract->interest_rate,
                'monthly_payout' => (float) $contract->monthly_payout,
                'total_expected' => $totalExpected,
                'total_paid' => $totalPaid,
                'total_overdue' => $schedules->where('status', 'overdue')->sum(fn ($s) => (float) $s->expected_amount - (float) $s->paid_amount),
            ],
        ]);
    }

    public function topupRequest(Request $request, int $id): JsonResponse
    {
        $investor = $request->user('investor');
        $contract = $investor->contracts()->findOrFail($id);

        if ($contract->status !== 'active') {
            return response()->json(['message' => 'Top-up requests can only be made on active contracts'], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:30000',
            'note' => 'nullable|string|max:500',
        ]);

        $topupRequest = ContractTopupRequest::create([
            'investor_id' => $investor->id,
            'contract_id' => $contract->id,
            'amount' => $validated['amount'],
            'note' => $validated['note'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json($topupRequest, 201);
    }

    public function myTopupRequests(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $requests = ContractTopupRequest::where('investor_id', $investor->id)
            ->with('contract')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    public function newContractRequest(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        // Eligibility: no active contract, OR oldest active contract started >= 6 months ago
        $activeContracts = $investor->contracts()->where('status', 'active')->get();

        if ($activeContracts->isNotEmpty()) {
            $eligibleContract = $activeContracts->first(
                fn (Contract $c) => Carbon::parse($c->start_date)->diffInMonths(now()) >= 6
            );

            if (!$eligibleContract) {
                return response()->json([
                    'message' => 'You can only request a new contract if your active contract is at least 6 months old.',
                ], 422);
            }
        }

        // Block duplicate pending requests
        $hasPending = NewContractRequest::where('investor_id', $investor->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'You already have a pending new contract request.'], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:50000',
            'note' => 'nullable|string|max:500',
        ]);

        $req = NewContractRequest::create([
            'investor_id' => $investor->id,
            'amount' => $validated['amount'],
            'note' => $validated['note'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json($req, 201);
    }

    public function myNewContractRequests(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $requests = NewContractRequest::where('investor_id', $investor->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }
}
