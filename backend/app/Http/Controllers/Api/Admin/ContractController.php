<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Investor;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    /**
     * List all contracts, optionally filtered by investor or status.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Contract::with('investor:id,investor_id,first_name,second_name,last_name,prefix');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('contract_id', 'like', "%{$search}%")
                    ->orWhereHas('investor', function ($iq) use ($search) {
                        $iq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('second_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('investor_id', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($investorId = $request->input('investor_id')) {
            $query->where('investor_id', $investorId);
        }

        $contracts = $query->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json($contracts);
    }

    /**
     * Show a single contract with its schedules.
     */
    public function show(Contract $contract): JsonResponse
    {
        $contract->load([
            'investor:id,investor_id,first_name,second_name,last_name,prefix,phone,email',
            'payoutSchedules' => fn ($q) => $q->orderBy('due_date'),
            'payoutSchedules.paymentAllocations.payment',
            'investmentTransactions',
        ]);

        return response()->json([
            'contract' => $contract,
            'summary' => [
                'total_invested' => (float) $contract->total_invested,
                'interest_rate' => (float) $contract->interest_rate,
                'monthly_payout' => (float) $contract->monthly_payout,
                'remaining_months' => $contract->remaining_months,
                'total_paid' => (float) $contract->payoutSchedules->sum('paid_amount'),
                'total_expected' => (float) $contract->payoutSchedules->sum('expected_amount'),
                'total_overdue' => (float) $contract->payoutSchedules
                    ->where('status', 'overdue')
                    ->sum(fn ($s) => (float) $s->expected_amount - (float) $s->paid_amount),
            ],
        ]);
    }

    /**
     * Create a new parallel contract for an investor.
     */
    public function store(Request $request, Investor $investor): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:50000',
            'start_date' => 'nullable|date',
            'custom_interest_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $customRate = !empty($validated['custom_interest_rate'])
            ? $validated['custom_interest_rate'] / 100
            : null;

        $contract = $this->investmentService->createNewContract(
            $investor,
            $validated['amount'],
            $validated['start_date'] ?? null,
            $customRate
        );

        ActivityService::log(
            $request->user()->id,
            $investor->id,
            'new_contract',
            "New parallel contract {$contract->contract_id} created with investment of {$validated['amount']}"
        );

        return response()->json($contract->fresh()->load('investor:id,investor_id,first_name,second_name,last_name'), 201);
    }

    /**
     * Renew a completed contract.
     */
    public function renew(Request $request, Investor $investor): JsonResponse
    {
        if ($investor->status !== 'completed') {
            return response()->json(['message' => 'Only completed contracts can be renewed'], 422);
        }

        $this->investmentService->renewContract($investor);

        ActivityService::log($request->user()->id, $investor->id, 'contract_renewed', 'Contract renewed for 12 months');

        return response()->json($investor->fresh());
    }

    /**
     * Get contracts for a specific investor.
     */
    public function investorContracts(Investor $investor): JsonResponse
    {
        $contracts = $investor->contracts()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($contracts);
    }
}
