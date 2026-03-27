<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\ReferralCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Investor $investor): JsonResponse
    {
        $schedules = $investor->payoutSchedules()
            ->with('paymentAllocations.payment')
            ->orderBy('due_date')
            ->get();

        $commissions = ReferralCommission::with('referred:id,investor_id,first_name,second_name')
            ->where('referrer_id', $investor->id)
            ->orderBy('payment_date')
            ->get();

        return response()->json([
            'schedules' => $schedules,
            'commissions' => $commissions,
        ]);
    }

    public function statement(Request $request, Investor $investor): JsonResponse
    {
        $from = $request->input('from');
        $to = $request->input('to');

        // Contracts summary
        $contractsQuery = $investor->contracts()->orderBy('start_date');
        $contracts = $contractsQuery->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'contract_id' => $c->contract_id,
                'total_invested' => (float) $c->total_invested,
                'interest_rate' => (float) $c->interest_rate,
                'monthly_payout' => (float) $c->monthly_payout,
                'start_date' => $c->start_date->toDateString(),
                'end_date' => $c->end_date->toDateString(),
                'status' => $c->status,
            ];
        });

        // Investment transactions (initial + topups)
        $txQuery = $investor->investmentTransactions()
            ->with('contract:id,contract_id')
            ->orderBy('date');
        if ($from) $txQuery->where('date', '>=', $from);
        if ($to) $txQuery->where('date', '<=', $to);
        $transactions = $txQuery->get();

        // Payout schedules
        $scheduleQuery = $investor->payoutSchedules()
            ->with(['paymentAllocations.payment', 'contract:id,contract_id'])
            ->orderBy('due_date');
        if ($from) $scheduleQuery->where('due_date', '>=', $from);
        if ($to) $scheduleQuery->where('due_date', '<=', $to);
        $schedules = $scheduleQuery->get();

        // Payments made
        $paymentQuery = $investor->payments()
            ->with('allocations.payoutSchedule')
            ->orderBy('payment_date', 'desc');
        if ($from) $paymentQuery->where('payment_date', '>=', $from);
        if ($to) $paymentQuery->where('payment_date', '<=', $to);
        $payments = $paymentQuery->get();

        // Commissions
        $commissionQuery = ReferralCommission::with('referred:id,investor_id,first_name,second_name')
            ->where('referrer_id', $investor->id)
            ->orderBy('payment_date');
        if ($from) $commissionQuery->where('payment_date', '>=', $from);
        if ($to) $commissionQuery->where('payment_date', '<=', $to);
        $commissions = $commissionQuery->get();

        // Totals
        $totalInvested = $contracts->sum('total_invested');
        $totalTopUps = $transactions->where('type', 'topup')->sum('amount');
        $totalExpected = $schedules->sum('expected_amount');
        $totalPaid = $schedules->sum('paid_amount');
        $totalPayments = $payments->sum('amount');

        return response()->json([
            'contracts' => $contracts,
            'transactions' => $transactions,
            'schedules' => $schedules,
            'payments' => $payments,
            'commissions' => $commissions,
            'totals' => [
                'total_invested' => (float) $totalInvested,
                'total_topups' => (float) $totalTopUps,
                'total_expected' => (float) $totalExpected,
                'total_paid' => (float) $totalPaid,
                'total_balance' => (float) ($totalExpected - $totalPaid),
                'total_payments' => (float) $totalPayments,
            ],
        ]);
    }
}
