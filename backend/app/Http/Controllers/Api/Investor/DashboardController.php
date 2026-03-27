<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $dueSchedules = $investor->payoutSchedules()
            ->where('due_date', '<=', now()->startOfDay())
            ->get();
        $totalDueToDate = $dueSchedules->sum(fn ($s) => max(0, (float) $s->expected_amount - (float) $s->paid_amount));

        return response()->json([
            'investor' => $investor,
            'summary' => [
                'total_invested' => (float) $investor->total_invested,
                'interest_rate' => (float) $investor->interest_rate,
                'monthly_payout' => (float) $investor->monthly_payout,
                'total_paid' => (float) $investor->payments()->sum('amount'),
                'total_due_to_date' => $totalDueToDate,
            ],
        ]);
    }
}
