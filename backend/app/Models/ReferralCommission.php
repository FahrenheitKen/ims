<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCommission extends Model
{
    protected $fillable = [
        'referral_id',
        'referrer_id',
        'referred_id',
        'commission_amount',
        'payment_date',
        'status',
    ];

    protected $casts = [
        'commission_amount' => 'decimal:0',
        'payment_date' => 'date',
    ];

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Investor::class, 'referrer_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(Investor::class, 'referred_id');
    }
}
