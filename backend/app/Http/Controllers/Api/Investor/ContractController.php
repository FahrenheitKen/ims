<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
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
            ->with(['payoutSchedules' => function ($q) {
                $q->orderBy('due_date')->with('paymentAllocations.payment');
            }])
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
}
