<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Referral extends Model
{
    protected $fillable = [
        'referrer_id',
        'referred_id',
        'status',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Investor::class, 'referrer_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(Investor::class, 'referred_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(ReferralCommission::class);
    }
}
