<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\Payment;
use App\Models\PayoutSchedule;
use App\Services\ActivityService;
use App\Services\PayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PayoutService $payoutService) {}

    public function index(Investor $investor): JsonResponse
    {
        $payments = $investor->payments()
            ->with('allocations.payoutSchedule')
            ->orderBy('payment_date', 'desc')
            ->paginate(15);

        return response()->json($payments);
    }

    public function store(Request $request, Investor $investor): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:mpesa,cheque,cash,bank_transfer',
            'reference' => 'nullable|string|unique:payments,reference',
            'payment_date' => 'nullable|date',
            'note' => 'nullable|string|max:500',
            'schedule_ids' => 'nullable|array',
            'schedule_ids.*' => 'exists:payout_schedules,id',
        ]);

        $reference = $validated['reference'] ?? PayoutService::generateReference();

        $payment = $this->payoutService->processPayment(
            $investor,
            $validated['amount'],
            $validated['method'],
            $reference,
            $validated['payment_date'] ?? null,
            $validated['note'] ?? null,
            $validated['schedule_ids'] ?? []
        );

        ActivityService::log(
            $request->user()->id,
            $investor->id,
            'payout_recorded',
            "Payment of {$validated['amount']} via {$validated['method']}. Ref: {$reference}"
        );

        return response()->json($payment->load('allocations.payoutSchedule'), 201);
    }

    public function update(Request $request, Investor $investor, Payment $payment): JsonResponse
    {
        if ($payment->investor_id !== $investor->id) {
            return response()->json(['message' => 'Payment does not belong to this investor'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:mpesa,cheque,cash,bank_transfer',
            'reference' => 'nullable|string|unique:payments,reference,' . $payment->id,
            'payment_date' => 'nullable|date',
            'note' => 'nullable|string|max:500',
        ]);

        $oldAmount = (float) $payment->amount;
        $newAmount = (float) $validated['amount'];

        // Reverse existing allocations
        foreach ($payment->allocations as $allocation) {
            $schedule = $allocation->payoutSchedule;
            $schedule->paid_amount = max(0, (float) $schedule->paid_amount - (float) $allocation->amount_allocated);
            $this->recalculateScheduleStatus($schedule);
            $schedule->save();
        }
        $payment->allocations()->delete();

        // Update the payment record
        $payment->update([
            'amount' => $newAmount,
            'method' => $validated['method'],
            'reference' => $validated['reference'] ?? $payment->reference,
            'payment_date' => isset($validated['payment_date']) ? \Carbon\Carbon::parse($validated['payment_date']) : $payment->payment_date,
            'note' => $validated['note'] ?? $payment->note,
        ]);

        // Re-allocate with new amount
        $remaining = $newAmount;
        $schedules = $investor->payoutSchedules()
            ->whereIn('status', ['overdue', 'partially_paid', 'pending'])
            ->orderBy('due_date')
            ->get();

        foreach ($schedules as $schedule) {
            if ($remaining <= 0) break;
            $balance = (float) $schedule->expected_amount - (float) $schedule->paid_amount;
            if ($balance <= 0) continue;

            $allocateAmount = min($remaining, $balance);
            \App\Models\PaymentAllocation::create([
                'payment_id' => $payment->id,
                'payout_schedule_id' => $schedule->id,
                'amount_allocated' => $allocateAmount,
            ]);

            $schedule->paid_amount = (float) $schedule->paid_amount + $allocateAmount;
            $this->recalculateScheduleStatus($schedule);
            $schedule->save();
            $remaining -= $allocateAmount;
        }

        ActivityService::log(
            $request->user()->id,
            $investor->id,
            'payment_updated',
            "Payment updated from {$oldAmount} to {$newAmount}. Ref: {$payment->reference}"
        );

        return response()->json($payment->fresh()->load('allocations.payoutSchedule'));
    }

    public function destroy(Request $request, Investor $investor, Payment $payment): JsonResponse
    {
        if ($payment->investor_id !== $investor->id) {
            return response()->json(['message' => 'Payment does not belong to this investor'], 403);
        }

        // Reverse all allocations
        foreach ($payment->allocations as $allocation) {
            $schedule = $allocation->payoutSchedule;
            $schedule->paid_amount = max(0, (float) $schedule->paid_amount - (float) $allocation->amount_allocated);
            $this->recalculateScheduleStatus($schedule);
            $schedule->save();
        }

        $payment->allocations()->delete();

        ActivityService::log(
            $request->user()->id,
            $investor->id,
            'payment_deleted',
            "Payment of {$payment->amount} deleted. Ref: {$payment->reference}"
        );

        $payment->delete();

        return response()->json(['message' => 'Payment deleted']);
    }

    private function recalculateScheduleStatus(PayoutSchedule $schedule): void
    {
        $paid = (float) $schedule->paid_amount;
        $expected = (float) $schedule->expected_amount;

        if ($paid <= 0) {
            $schedule->status = $schedule->due_date->isPast() ? 'overdue' : 'pending';
        } elseif ($paid >= $expected) {
            $schedule->status = $schedule->due_date->isFuture() ? 'paid_in_advance' : 'paid';
        } else {
            $schedule->status = 'partially_paid';
        }
    }

    public function summary(Investor $investor): JsonResponse
    {
        $overdue = $investor->payoutSchedules()
            ->whereIn('status', ['overdue', 'partially_paid'])
            ->where('due_date', '<', now()->startOfDay())
            ->orderBy('due_date')
            ->get();

        $currentDue = $investor->payoutSchedules()
            ->whereIn('status', ['pending', 'partially_paid'])
            ->where('due_date', '>=', now()->startOfMonth())
            ->where('due_date', '<=', now()->endOfMonth())
            ->first();

        $totalOverdue = $overdue->sum(fn ($s) => (float) $s->expected_amount - (float) $s->paid_amount);

        return response()->json([
            'overdue_entries' => $overdue,
            'current_due' => $currentDue,
            'total_overdue' => $totalOverdue,
            'total_invested' => (float) $investor->total_invested,
            'interest_rate' => (float) $investor->interest_rate,
            'monthly_payout' => (float) $investor->monthly_payout,
        ]);
    }
}
