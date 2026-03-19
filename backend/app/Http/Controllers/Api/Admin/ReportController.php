<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\PayoutSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function monthlyPayout(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
        ]);

        $month = $request->input('month');
        $year = $request->input('year');

        $schedules = PayoutSchedule::with('investor:id,investor_id,first_name,second_name,last_name,total_invested,monthly_payout')
            ->whereMonth('due_date', $month)
            ->whereYear('due_date', $year)
            ->orderBy('due_date')
            ->get();

        $totalPayable = $schedules->sum('expected_amount');
        $totalPaid = $schedules->sum('paid_amount');

        return response()->json([
            'schedules' => $schedules,
            'summary' => [
                'total_payable' => (float) $totalPayable,
                'total_paid' => (float) $totalPaid,
                'total_outstanding' => (float) ($totalPayable - $totalPaid),
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }

    public function overdue(): JsonResponse
    {
        $overdueInvestors = Investor::where('status', 'active')
            ->whereHas('payoutSchedules', fn ($q) => $q->where('status', 'overdue'))
            ->withCount(['payoutSchedules as overdue_months' => fn ($q) => $q->where('status', 'overdue')])
            ->withSum(['payoutSchedules as total_overdue_amount' => fn ($q) => $q->where('status', 'overdue')], \Illuminate\Support\Facades\DB::raw('expected_amount - paid_amount'))
            ->with(['payoutSchedules' => fn ($q) => $q->where('status', 'overdue')->orderBy('due_date')->limit(1)])
            ->get()
            ->map(function ($investor) {
                return [
                    'investor_id' => $investor->investor_id,
                    'name' => $investor->full_name,
                    'total_overdue_amount' => (float) $investor->total_overdue_amount,
                    'overdue_months' => $investor->overdue_months,
                    'earliest_overdue_date' => $investor->payoutSchedules->first()?->due_date,
                ];
            });

        $totalOverdue = $overdueInvestors->sum('total_overdue_amount');

        return response()->json([
            'investors' => $overdueInvestors,
            'total_overdue' => $totalOverdue,
        ]);
    }
}
