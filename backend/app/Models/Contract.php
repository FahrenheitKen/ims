<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    protected $fillable = [
        'investor_id', 'contract_id', 'total_invested', 'interest_rate',
        'monthly_payout', 'start_date', 'end_date', 'status',
    ];

    protected function casts(): array
    {
        return [
            'total_invested' => 'decimal:2',
            'interest_rate' => 'decimal:4',
            'monthly_payout' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function getRemainingMonthsAttribute(): int
    {
        if ($this->status !== 'active') return 0;
        $now = now()->startOfDay();
        $end = $this->end_date->startOfDay();
        if ($now->gte($end)) return 0;
        return (int) $now->diffInMonths($end);
    }

    public function investor(): BelongsTo
    {
        return $this->belongsTo(Investor::class);
    }

    public function payoutSchedules(): HasMany
    {
        return $this->hasMany(PayoutSchedule::class);
    }

    public function investmentTransactions(): HasMany
    {
        return $this->hasMany(InvestmentTransaction::class);
    }

    /**
     * Generate a unique contract ID: {investor_id}/{MM}/{YYYY}
     * If a contract already exists for that investor in the same month/year, append a sequence number.
     */
    public static function generateContractId(Investor $investor): string
    {
        $month = now()->format('m');
        $year = now()->format('Y');
        $base = "{$investor->investor_id}/{$month}/{$year}";

        $exists = static::where('contract_id', $base)->exists();
        if (!$exists) {
            return $base;
        }

        // Append sequence number for duplicates in the same month
        $count = static::where('contract_id', 'like', "{$base}%")->count();
        return "{$base}-" . ($count + 1);
    }
}
