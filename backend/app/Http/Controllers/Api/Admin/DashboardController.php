<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContractTopupRequest;
use App\Models\NewContractRequest;
use App\Models\Investor;
use App\Models\Payment;
use App\Models\PayoutSchedule;
use App\Models\ReferralCommission;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $range = $this->getDateRange($request->input('range', 'this_month'), $request->input('start_date'), $request->input('end_date'));
        $start = $range['start'];
        $end = $range['end'];

        $newInvestors = Investor::whereBetween('created_at', [$start, $end])->count();

        $totalSumInvested = Investor::where('status', 'active')->sum('total_invested');

        $totalDuePayout = PayoutSchedule::whereBetween('due_date', [$start, $end])
            ->whereIn('status', ['pending', 'overdue', 'partially_paid'])
            ->selectRaw('SUM(expected_amount - paid_amount) as total')
            ->value('total') ?? 0;

        $totalPayoutPaid = Payment::whereBetween('payment_date', [$start, $end])->sum('amount');

        $totalOverdue = PayoutSchedule::where('status', 'overdue')
            ->orWhere(function ($q) {
                $q->where('status', 'partially_paid')
                    ->where('due_date', '<', now()->startOfDay());
            })
            ->selectRaw('SUM(expected_amount - paid_amount) as total')
            ->value('total') ?? 0;

        return response()->json([
            'new_investors' => $newInvestors,
            'total_sum_invested' => (float) $totalSumInvested,
            'total_due_payout' => (float) $totalDuePayout,
            'total_payout_paid' => (float) $totalPayoutPaid,
            'total_overdue' => (float) $totalOverdue,
        ]);
    }

    public function calendar(Request $request): JsonResponse
    {
        // Show current month + next month by default, or a requested month range
        $month = $request->query('month'); // format: YYYY-MM
        if ($month) {
            $start = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            $end = $start->copy()->endOfMonth();
        } else {
            $start = now()->startOfMonth();
            $end = now()->addMonth()->endOfMonth();
        }

        $schedules = PayoutSchedule::with('investor:id,first_name,second_name,last_name,investor_id')
            ->whereBetween('due_date', [$start, $end])
            ->orderBy('due_date')
            ->get();

        $commissions = ReferralCommission::with('referrer:id,first_name,second_name,last_name,investor_id', 'referred:id,first_name,second_name,last_name,investor_id')
            ->where('status', 'pending')
            ->whereBetween('payment_date', [$start, $end])
            ->orderBy('payment_date')
            ->get();

        // Merge schedules and commissions into a single date-grouped structure
        $grouped = $schedules->groupBy(fn ($s) => $s->due_date->format('Y-m-d'))->toArray();

        foreach ($commissions as $commission) {
            $dateKey = $commission->payment_date->format('Y-m-d');
            $grouped[$dateKey][] = [
                'id' => 'comm_' . $commission->id,
                'due_date' => $dateKey,
                'expected_amount' => (float) $commission->commission_amount,
                'paid_amount' => 0,
                'status' => 'commission',
                'type' => 'commission',
                'investor' => $commission->referrer ? [
                    'id' => $commission->referrer->id,
                    'first_name' => $commission->referrer->first_name,
                    'second_name' => $commission->referrer->second_name,
                    'last_name' => $commission->referrer->last_name,
                    'investor_id' => $commission->referrer->investor_id,
                ] : null,
                'referred' => $commission->referred ? [
                    'first_name' => $commission->referred->first_name,
                    'second_name' => $commission->referred->second_name,
                ] : null,
            ];
        }

        ksort($grouped);

        return response()->json($grouped);
    }

    public function notifications(): JsonResponse
    {
        $items = [];

        // Individual pending investor registrations
        Investor::where('status', 'pending')
            ->select('id', 'prefix', 'first_name', 'second_name', 'last_name', 'created_at')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->each(function (Investor $inv) use (&$items) {
                $parts = array_filter([$inv->prefix, $inv->first_name, $inv->second_name, $inv->last_name]);
                $items[] = [
                    'type'        => 'investor_pending',
                    'id'          => $inv->id,
                    'investor_id' => $inv->id,
                    'label'       => 'Pending registration: ' . implode(' ', $parts),
                    'sub_label'   => 'Registered ' . $inv->created_at->diffForHumans(),
                ];
            });

        // Individual pending top-up requests
        ContractTopupRequest::where('status', 'pending')
            ->with(['investor:id,prefix,first_name,second_name,last_name', 'contract:id,contract_id'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->each(function (ContractTopupRequest $req) use (&$items) {
                $inv = $req->investor;
                $parts = array_filter([$inv?->prefix, $inv?->first_name, $inv?->second_name, $inv?->last_name]);
                $name = $parts ? implode(' ', $parts) : 'Unknown';
                $amount = 'KES ' . number_format((float) $req->amount, 0);
                $contract = $req->contract?->contract_id ?? '';
                $items[] = [
                    'type'        => 'topup_pending',
                    'id'          => $req->id,
                    'investor_id' => $req->investor_id,
                    'label'       => "Top-up request from {$name}",
                    'sub_label'   => $amount . ($contract ? " · {$contract}" : ''),
                ];
            });

        // Individual pending new contract requests
        NewContractRequest::where('status', 'pending')
            ->with('investor:id,prefix,first_name,second_name,last_name')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->each(function (NewContractRequest $req) use (&$items) {
                $inv = $req->investor;
                $parts = array_filter([$inv?->prefix, $inv?->first_name, $inv?->second_name, $inv?->last_name]);
                $name = $parts ? implode(' ', $parts) : 'Unknown';
                $amount = 'KES ' . number_format((float) $req->amount, 0);
                $items[] = [
                    'type'        => 'new_contract_pending',
                    'id'          => $req->id,
                    'investor_id' => $req->investor_id,
                    'label'       => "New contract request from {$name}",
                    'sub_label'   => $amount,
                ];
            });

        // Sort by most recent first (already ordered per type; merge keeps insertion order)
        return response()->json([
            'total' => count($items),
            'items' => $items,
        ]);
    }

    private function getDateRange(string $range, ?string $customStart, ?string $customEnd): array
    {
        return match ($range) {
            'today' => ['start' => now()->startOfDay(), 'end' => now()->endOfDay()],
            'yesterday' => ['start' => now()->subDay()->startOfDay(), 'end' => now()->subDay()->endOfDay()],
            'last_7_days' => ['start' => now()->subDays(7)->startOfDay(), 'end' => now()->endOfDay()],
            'last_30_days' => ['start' => now()->subDays(30)->startOfDay(), 'end' => now()->endOfDay()],
            'this_month' => ['start' => now()->startOfMonth(), 'end' => now()->endOfMonth()],
            'last_month' => ['start' => now()->subMonth()->startOfMonth(), 'end' => now()->subMonth()->endOfMonth()],
            'this_month_last_year' => ['start' => now()->subYear()->startOfMonth(), 'end' => now()->subYear()->endOfMonth()],
            'last_year' => ['start' => now()->subYear()->startOfYear(), 'end' => now()->subYear()->endOfYear()],
            'current_financial_year' => [
                'start' => now()->month >= 7 ? Carbon::create(now()->year, 7, 1)->startOfDay() : Carbon::create(now()->year - 1, 7, 1)->startOfDay(),
                'end' => now()->month >= 7 ? Carbon::create(now()->year + 1, 6, 30)->endOfDay() : Carbon::create(now()->year, 6, 30)->endOfDay(),
            ],
            'custom' => [
                'start' => $customStart ? Carbon::parse($customStart)->startOfDay() : now()->startOfMonth(),
                'end' => $customEnd ? Carbon::parse($customEnd)->endOfDay() : now()->endOfMonth(),
            ],
            default => ['start' => now()->startOfMonth(), 'end' => now()->endOfMonth()],
        };
    }
}
