<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\ReferralCommission;
use Illuminate\Http\JsonResponse;

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
}
