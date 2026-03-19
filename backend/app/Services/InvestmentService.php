<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\InvestmentTransaction;
use App\Models\PayoutSchedule;
use Carbon\Carbon;

class InvestmentService
{
    public static function getInterestRate(float $totalInvested): float
    {
        if ($totalInvested >= 500000) return 0.25;
        if ($totalInvested >= 150000) return 0.2308;
        return 0.175;
    }

    public static function calculateMonthlyPayout(float $totalInvested, float $rate): float
    {
        return round($totalInvested * $rate, 2);
    }

    public static function generateInvestorId(): string
    {
        $latest = Investor::withTrashed()->orderBy('id', 'desc')->first();
        $nextNum = $latest ? $latest->id + 1 : 1;
        return 'KAP-' . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
    }

    public function createInvestment(Investor $investor, float $amount, ?float $customRate = null): void
    {
        $rate = $customRate ?? self::getInterestRate($amount);
        $monthlyPayout = self::calculateMonthlyPayout($amount, $rate);

        $investor->update([
            'total_invested' => $amount,
            'interest_rate' => $rate,
            'monthly_payout' => $monthlyPayout,
        ]);

        InvestmentTransaction::create([
            'investor_id' => $investor->id,
            'type' => 'initial',
            'amount' => $amount,
            'date' => $investor->start_date,
            'note' => 'Initial investment',
        ]);

        $this->generateScheduleEntries($investor, $investor->start_date, 12, $monthlyPayout);
    }

    public function processTopUp(Investor $investor, float $amount, string $date, ?string $note = null): void
    {
        $topUpDate = Carbon::parse($date);
        $newTotal = (float) $investor->total_invested + $amount;
        $newRate = self::getInterestRate($newTotal);
        $newPayout = self::calculateMonthlyPayout($newTotal, $newRate);

        $investor->update([
            'total_invested' => $newTotal,
            'interest_rate' => $newRate,
            'monthly_payout' => $newPayout,
        ]);

        InvestmentTransaction::create([
            'investor_id' => $investor->id,
            'type' => 'topup',
            'amount' => $amount,
            'date' => $topUpDate,
            'note' => $note ?? 'Top up',
        ]);

        // Update future schedule entries (next month onward from top-up date)
        $nextMonthStart = $topUpDate->copy()->addMonth()->startOfMonth();
        $investor->payoutSchedules()
            ->where('due_date', '>=', $nextMonthStart)
            ->whereIn('status', ['pending', 'overdue'])
            ->update(['expected_amount' => $newPayout]);
    }

    public function generateScheduleEntries(Investor $investor, Carbon $startDate, int $count, float $amount): void
    {
        $dayOfMonth = $startDate->day;

        for ($i = 1; $i <= $count; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);

            // Handle months with fewer days
            $maxDay = $dueDate->daysInMonth;
            if ($dayOfMonth > $maxDay) {
                $dueDate->day = $maxDay;
            } else {
                $dueDate->day = $dayOfMonth;
            }

            PayoutSchedule::create([
                'investor_id' => $investor->id,
                'due_date' => $dueDate,
                'expected_amount' => $amount,
                'paid_amount' => 0,
                'status' => 'pending',
            ]);
        }
    }

    public function renewContract(Investor $investor): void
    {
        $renewalDate = now();
        $endDate = $renewalDate->copy()->addYear();

        $investor->update([
            'start_date' => $renewalDate,
            'end_date' => $endDate,
            'status' => 'active',
        ]);

        $this->generateScheduleEntries($investor, $renewalDate, 12, (float) $investor->monthly_payout);
    }
}
