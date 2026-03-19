<?php

namespace App\Services;

use App\Models\Investor;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\PayoutSchedule;
use Carbon\Carbon;

class PayoutService
{
    public function processPayment(
        Investor $investor,
        float $amount,
        string $method,
        string $reference,
        ?string $paymentDate = null,
        ?string $note = null,
        array $scheduleIds = []
    ): Payment {
        $payment = Payment::create([
            'investor_id' => $investor->id,
            'payment_date' => $paymentDate ? Carbon::parse($paymentDate) : now(),
            'amount' => $amount,
            'method' => $method,
            'reference' => $reference,
            'note' => $note,
        ]);

        $remaining = $amount;

        // Get schedules to allocate to — either specified or chronological
        if (!empty($scheduleIds)) {
            $schedules = $investor->payoutSchedules()
                ->whereIn('id', $scheduleIds)
                ->orderBy('due_date')
                ->get();
        } else {
            $schedules = $investor->payoutSchedules()
                ->whereIn('status', ['overdue', 'partially_paid', 'pending'])
                ->orderBy('due_date')
                ->get();
        }

        foreach ($schedules as $schedule) {
            if ($remaining <= 0) break;

            $balance = (float) $schedule->expected_amount - (float) $schedule->paid_amount;
            if ($balance <= 0) continue;

            $allocateAmount = min($remaining, $balance);

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'payout_schedule_id' => $schedule->id,
                'amount_allocated' => $allocateAmount,
            ]);

            $newPaidAmount = (float) $schedule->paid_amount + $allocateAmount;
            $schedule->paid_amount = $newPaidAmount;

            if ($newPaidAmount >= (float) $schedule->expected_amount) {
                $isPastDue = $schedule->due_date->isPast();
                $isFuture = $schedule->due_date->isFuture();
                $schedule->status = $isFuture ? 'paid_in_advance' : 'paid';
            } else {
                $schedule->status = 'partially_paid';
            }

            $schedule->save();
            $remaining -= $allocateAmount;
        }

        return $payment;
    }

    public static function generateReference(): string
    {
        return 'PAY-' . strtoupper(uniqid());
    }

    public static function markOverdueSchedules(): int
    {
        return PayoutSchedule::where('status', 'pending')
            ->where('due_date', '<', now()->startOfDay())
            ->update(['status' => 'overdue']);
    }
}
