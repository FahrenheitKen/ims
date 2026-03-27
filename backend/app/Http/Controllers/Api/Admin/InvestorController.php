<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\Referral;
use App\Models\ReferralCommission;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Notifications\InvestorApprovedNotification;

class InvestorController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Investor::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('second_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id_number', 'like', "%{$search}%")
                    ->orWhere('investor_id', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $investors = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($investors);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:10',
            'first_name' => 'required|string|max:255',
            'second_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'id_number' => 'required|string|unique:investors,id_number',
            'other_phone' => 'nullable|string|max:20',
            'email' => 'required|email|unique:investors,email',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:50',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:50',
            'bank_branch' => 'nullable|string|max:255',
        ]);

        $investor = Investor::create([
            'investor_id' => InvestmentService::generateInvestorId(),
            'prefix' => $validated['prefix'] ?? null,
            'first_name' => $validated['first_name'],
            'second_name' => $validated['second_name'],
            'last_name' => $validated['last_name'] ?? null,
            'phone' => $validated['phone'],
            'id_number' => $validated['id_number'],
            'other_phone' => $validated['other_phone'] ?? null,
            'email' => $validated['email'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'country' => $validated['country'],
            'tax_id' => $validated['tax_id'] ?? null,
            'next_of_kin_name' => $validated['next_of_kin_name'] ?? null,
            'next_of_kin_phone' => $validated['next_of_kin_phone'] ?? null,
            'next_of_kin_relationship' => $validated['next_of_kin_relationship'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'bank_branch' => $validated['bank_branch'] ?? null,
            'total_invested' => 0,
            'interest_rate' => 0,
            'monthly_payout' => 0,
            'start_date' => now(),
            'end_date' => now()->addYear(),
            'password' => $validated['id_number'],
            'status' => 'active',
        ]);

        ActivityService::log($request->user()->id, $investor->id, 'created', 'Investor created');

        return response()->json($investor->fresh(), 201);
    }

    public function show(Investor $investor): JsonResponse
    {
        $investor->load(['payoutSchedules' => fn ($q) => $q->orderBy('due_date'), 'investmentTransactions']);

        return response()->json([
            'investor' => $investor,
            'summary' => [
                'total_invested' => (float) $investor->total_invested,
                'interest_rate' => (float) $investor->interest_rate,
                'monthly_payout' => (float) $investor->monthly_payout,
                'remaining_months' => $investor->remaining_months,
                'total_paid' => $investor->payments()->sum('amount'),
                'total_overdue' => $investor->payoutSchedules()
                    ->where('status', 'overdue')
                    ->selectRaw('SUM(expected_amount - paid_amount) as total')
                    ->value('total') ?? 0,
            ],
        ]);
    }

    public function update(Request $request, Investor $investor): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:10',
            'first_name' => 'required|string|max:255',
            'second_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'id_number' => ['required', 'string', Rule::unique('investors')->ignore($investor->id)],
            'other_phone' => 'nullable|string|max:20',
            'email' => ['required', 'email', Rule::unique('investors')->ignore($investor->id)],
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:50',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:50',
            'bank_branch' => 'nullable|string|max:255',
        ]);

        $investor->update($validated);

        ActivityService::log($request->user()->id, $investor->id, 'edited', 'Investor details updated');

        return response()->json($investor);
    }

    public function destroy(Request $request, Investor $investor): JsonResponse
    {
        if ($investor->status === 'active') {
            return response()->json(['message' => 'Cannot delete an investor with an active contract'], 422);
        }

        $pendingPayments = $investor->payoutSchedules()
            ->whereIn('status', ['pending', 'partially_paid', 'overdue'])
            ->exists();

        if ($pendingPayments) {
            return response()->json(['message' => 'Cannot delete investor with pending payments'], 422);
        }

        ActivityService::log($request->user()->id, $investor->id, 'deleted', 'Investor soft deleted');
        $investor->delete();

        return response()->json(['message' => 'Investor deleted successfully']);
    }

    public function deactivate(Request $request, Investor $investor): JsonResponse
    {
        $investor->update(['status' => 'deactivated']);
        ActivityService::log($request->user()->id, $investor->id, 'deactivated', 'Investor deactivated');

        return response()->json($investor);
    }

    public function reactivate(Request $request, Investor $investor): JsonResponse
    {
        $investor->update(['status' => 'active']);
        ActivityService::log($request->user()->id, $investor->id, 'reactivated', 'Investor reactivated');

        return response()->json($investor);
    }

    public function approve(Request $request, Investor $investor): JsonResponse
    {
        if ($investor->status !== 'pending') {
            return response()->json(['message' => 'Only pending investors can be approved'], 422);
        }

        $startDate = now();
        $endDate = $startDate->copy()->addYear();
        $investor->update([
            'status' => 'active',
            'start_date' => $startDate,
            'end_date' => $endDate,
        ]);

        // If investor self-registered with an investment amount, auto-create a contract
        if ($investor->total_invested > 0 && $investor->contracts()->count() === 0) {
            $this->investmentService->createInvestment($investor, (float) $investor->total_invested);
        }

        ActivityService::log($request->user()->id, $investor->id, 'approved', 'Investor registration approved');

        // Handle referral commission if this investor was referred
        $referral = Referral::where('referred_id', $investor->id)->where('status', 'pending')->first();
        if ($referral) {
            $referral->update(['status' => 'approved']);

            // Commission = 1% of the referred investor's total payout (monthly_payout * 12)
            $investor->refresh();
            $totalPayout = (float) $investor->monthly_payout * 12;
            $commissionAmount = round($totalPayout * 0.01, 2);

            if ($commissionAmount > 0) {
                // Payment date = same day next month as the referred investor's first payout
                $firstPayoutDate = $investor->start_date->copy()->addMonth();
                $paymentDate = $firstPayoutDate->copy()->addMonth();

                ReferralCommission::create([
                    'referral_id' => $referral->id,
                    'referrer_id' => $referral->referrer_id,
                    'referred_id' => $investor->id,
                    'commission_amount' => $commissionAmount,
                    'payment_date' => $paymentDate,
                    'status' => 'pending',
                ]);
            }
        }

        // Send approval email with login credentials
        $loginUrl = 'http://localhost:5173/investor/login';
        $investor->notify(new InvestorApprovedNotification($loginUrl));

        return response()->json($investor->fresh());
    }

    public function reject(Request $request, Investor $investor): JsonResponse
    {
        if ($investor->status !== 'pending') {
            return response()->json(['message' => 'Only pending investors can be rejected'], 422);
        }

        ActivityService::log($request->user()->id, $investor->id, 'rejected', 'Investor registration rejected');
        $investor->delete();

        return response()->json(['message' => 'Investor registration rejected']);
    }

    public function referrals(Investor $investor): JsonResponse
    {
        $referrals = Referral::with([
            'referred:id,investor_id,first_name,second_name,phone,email,total_invested,monthly_payout,status,created_at',
            'commissions',
        ])
            ->where('referrer_id', $investor->id)
            ->orderByDesc('created_at')
            ->get();

        $commissions = ReferralCommission::where('referrer_id', $investor->id)
            ->orderByDesc('payment_date')
            ->get();

        return response()->json([
            'referral_code' => $investor->referral_code,
            'referrals' => $referrals,
            'commissions' => $commissions,
            'stats' => [
                'total_referrals' => $referrals->count(),
                'approved' => $referrals->where('status', 'approved')->count(),
                'pending' => $referrals->where('status', 'pending')->count(),
                'total_earned' => (float) $commissions->where('status', 'paid')->sum('commission_amount'),
                'total_pending' => (float) $commissions->where('status', 'pending')->sum('commission_amount'),
            ],
        ]);
    }
}
