<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutSchedule extends Model
{
    protected $fillable = ['investor_id', 'due_date', 'expected_amount', 'paid_amount', 'status'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'expected_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function getBalanceAttribute(): float
    {
        return (float) $this->expected_amount - (float) $this->paid_amount;
    }

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function paymentAllocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'payout_schedule_id');
    }
}
