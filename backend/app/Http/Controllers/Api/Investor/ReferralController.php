<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\ReferralCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user();

        // Get referral stats
        $referrals = Referral::with(['referred:id,first_name,second_name,investor_id,status,total_invested,created_at'])
            ->where('referrer_id', $investor->id)
            ->orderByDesc('created_at')
            ->get();

        $commissions = ReferralCommission::where('referrer_id', $investor->id)
            ->orderByDesc('payment_date')
            ->get();

        $totalEarned = $commissions->where('status', 'paid')->sum('commission_amount');
        $totalPending = $commissions->where('status', 'pending')->sum('commission_amount');

        return response()->json([
            'referral_code' => $investor->referral_code,
            'referrals' => $referrals,
            'commissions' => $commissions,
            'stats' => [
                'total_referrals' => $referrals->count(),
                'approved_referrals' => $referrals->where('status', 'approved')->count(),
                'pending_referrals' => $referrals->where('status', 'pending')->count(),
                'total_earned' => (float) $totalEarned,
                'total_pending' => (float) $totalPending,
            ],
        ]);
    }
}
