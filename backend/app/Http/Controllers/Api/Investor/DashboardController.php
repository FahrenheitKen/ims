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

        return response()->json([
            'investor' => $investor,
            'summary' => [
                'total_invested' => (float) $investor->total_invested,
                'interest_rate' => (float) $investor->interest_rate,
                'monthly_payout' => (float) $investor->monthly_payout,
                'remaining_months' => $investor->remaining_months,
                'total_paid' => $investor->payments()->sum('amount'),
                'contract_start' => $investor->start_date,
                'contract_end' => $investor->end_date,
            ],
        ]);
    }
}
