<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAllocation extends Model
{
    protected $fillable = ['payment_id', 'payout_schedule_id', 'amount_allocated'];

    protected function casts(): array
    {
        return [
            'amount_allocated' => 'decimal:0',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function payoutSchedule(): BelongsTo
    {
        return $this->belongsTo(PayoutSchedule::class);
    }
}
