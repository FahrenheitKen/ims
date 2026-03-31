<?php

namespace App\Models;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class Investor extends Authenticatable
{
    use HasFactory, SoftDeletes, HasApiTokens, Notifiable;

    /**
     * Send the password reset notification with a link to the investor portal.
     */
    public function sendPasswordResetNotification($token): void
    {
        $url = 'http://localhost:5173/investor/reset-password?token=' . $token . '&email=' . urlencode($this->email);
        $this->notify(new \App\Notifications\InvestorResetPasswordNotification($url));
    }

    protected $fillable = [
        'investor_id', 'prefix', 'first_name', 'second_name', 'last_name',
        'phone', 'id_number', 'other_phone', 'email', 'address', 'city', 'country',
        'tax_id', 'next_of_kin_name', 'next_of_kin_phone', 'next_of_kin_relationship',
        'bank_name', 'bank_account', 'bank_branch',
        'total_invested', 'interest_rate', 'monthly_payout',
        'start_date', 'end_date', 'password', 'password_changed', 'status',
        'referral_code', 'referred_by_code',
    ];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return [
            'total_invested' => 'decimal:0',
            'interest_rate' => 'decimal:4',
            'monthly_payout' => 'decimal:0',
            'start_date' => 'date',
            'end_date' => 'date',
            'password' => 'hashed',
            'password_changed' => 'boolean',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return trim(($this->prefix ? $this->prefix . ' ' : '') . $this->first_name . ' ' . $this->second_name . ($this->last_name ? ' ' . $this->last_name : ''));
    }

    public function getRemainingMonthsAttribute(): int
    {
        if ($this->status !== 'active') return 0;
        $now = now()->startOfDay();
        $end = $this->end_date->startOfDay();
        if ($now->gte($end)) return 0;
        return (int) $now->diffInMonths($end);
    }

    public function investmentTransactions(): HasMany
    {
        return $this->hasMany(InvestmentTransaction::class);
    }

    public function payoutSchedules(): HasMany
    {
        return $this->hasMany(PayoutSchedule::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    // Referral relationships
    public function referralsMade(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referralReceived()
    {
        return $this->hasOne(Referral::class, 'referred_id');
    }

    public function referralCommissions(): HasMany
    {
        return $this->hasMany(ReferralCommission::class, 'referrer_id');
    }

    protected static function booted(): void
    {
        static::creating(function (Investor $investor) {
            if (empty($investor->referral_code)) {
                $investor->referral_code = self::generateReferralCode();
            }
        });
    }

    public static function generateReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (static::withTrashed()->where('referral_code', $code)->exists());

        return $code;
    }
}
