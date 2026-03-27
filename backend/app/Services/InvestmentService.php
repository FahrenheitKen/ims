<?php

namespace App\Services;

use App\Models\Contract;
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
        return 'KAP-' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
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

        // Create the contract
        $contract = Contract::create([
            'investor_id' => $investor->id,
            'contract_id' => Contract::generateContractId($investor),
            'total_invested' => $amount,
            'interest_rate' => $rate,
            'monthly_payout' => $monthlyPayout,
            'start_date' => $investor->start_date,
            'end_date' => $investor->end_date,
            'status' => 'active',
        ]);

        InvestmentTransaction::create([
            'investor_id' => $investor->id,
            'contract_id' => $contract->id,
            'type' => 'initial',
            'amount' => $amount,
            'date' => $investor->start_date,
            'note' => 'Initial investment',
        ]);

        $this->generateScheduleEntries($investor, $investor->start_date, 12, $monthlyPayout, $contract);
    }

    public function createNewContract(Investor $investor, float $amount, ?string $startDate = null, ?float $customRate = null): Contract
    {
        $start = $startDate ? Carbon::parse($startDate) : now();
        $end = $start->copy()->addYear();
        $rate = $customRate ?? self::getInterestRate($amount);
        $monthlyPayout = self::calculateMonthlyPayout($amount, $rate);

        $contract = Contract::create([
            'investor_id' => $investor->id,
            'contract_id' => Contract::generateContractId($investor),
            'total_invested' => $amount,
            'interest_rate' => $rate,
            'monthly_payout' => $monthlyPayout,
            'start_date' => $start,
            'end_date' => $end,
            'status' => 'active',
        ]);

        InvestmentTransaction::create([
            'investor_id' => $investor->id,
            'contract_id' => $contract->id,
            'type' => 'initial',
            'amount' => $amount,
            'date' => $start,
            'note' => 'New parallel contract',
        ]);

        $this->generateScheduleEntries($investor, $start, 12, $monthlyPayout, $contract);

        // Update investor aggregate totals
        $this->updateInvestorAggregates($investor);

        return $contract;
    }

    public function processTopUp(Investor $investor, float $amount, string $date, ?string $note = null, ?Contract $contract = null): void
    {
        $topUpDate = Carbon::parse($date);

        // Use the specified contract, or fall back to the latest active one
        $targetContract = $contract ?? $investor->contracts()->where('status', 'active')->latest()->first();

        if ($targetContract) {
            $newContractTotal = (float) $targetContract->total_invested + $amount;
            $newRate = self::getInterestRate($newContractTotal);
            $newPayout = self::calculateMonthlyPayout($newContractTotal, $newRate);

            $targetContract->update([
                'total_invested' => $newContractTotal,
                'interest_rate' => $newRate,
                'monthly_payout' => $newPayout,
            ]);

            // Update future schedule entries for this contract
            $nextMonthStart = $topUpDate->copy()->addMonth()->startOfMonth();
            $investor->payoutSchedules()
                ->where('contract_id', $targetContract->id)
                ->where('due_date', '>=', $nextMonthStart)
                ->whereIn('status', ['pending', 'overdue'])
                ->update(['expected_amount' => $newPayout]);
        }

        InvestmentTransaction::create([
            'investor_id' => $investor->id,
            'contract_id' => $targetContract?->id,
            'type' => 'topup',
            'amount' => $amount,
            'date' => $topUpDate,
            'note' => $note ?? 'Top up',
        ]);

        // Recalculate investor-level aggregates
        $this->updateInvestorAggregates($investor);
    }

    public function generateScheduleEntries(Investor $investor, Carbon $startDate, int $count, float $amount, ?Contract $contract = null): void
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
                'contract_id' => $contract?->id,
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

        // Create a new contract for the renewal
        $contract = Contract::create([
            'investor_id' => $investor->id,
            'contract_id' => Contract::generateContractId($investor),
            'total_invested' => (float) $investor->total_invested,
            'interest_rate' => (float) $investor->interest_rate,
            'monthly_payout' => (float) $investor->monthly_payout,
            'start_date' => $renewalDate,
            'end_date' => $endDate,
            'status' => 'active',
        ]);

        $this->generateScheduleEntries($investor, $renewalDate, 12, (float) $investor->monthly_payout, $contract);
    }

    /**
     * Recalculate investor-level aggregate totals from all active contracts.
     */
    public function updateInvestorAggregates(Investor $investor): void
    {
        $activeContracts = $investor->contracts()->where('status', 'active')->get();
        $totalInvested = $activeContracts->sum('total_invested');
        $totalMonthlyPayout = $activeContracts->sum('monthly_payout');

        $investor->update([
            'total_invested' => $totalInvested,
            'monthly_payout' => $totalMonthlyPayout,
        ]);
    }
}
