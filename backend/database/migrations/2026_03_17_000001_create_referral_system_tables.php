<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Add referral columns to investors table
        Schema::table('investors', function (Blueprint $table) {
            $table->string('referral_code', 10)->unique()->nullable()->after('status');
            $table->string('referred_by_code', 10)->nullable()->after('referral_code');
        });

        // Generate referral codes for all existing investors
        $investors = \App\Models\Investor::withTrashed()->whereNull('referral_code')->get();
        foreach ($investors as $investor) {
            $investor->update(['referral_code' => self::generateCode()]);
        }

        // Referrals: tracks who referred whom
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->constrained('investors')->cascadeOnDelete();
            $table->foreignId('referred_id')->constrained('investors')->cascadeOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();

            $table->unique(['referrer_id', 'referred_id']);
        });

        // Referral commissions: tracks earned commissions
        Schema::create('referral_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_id')->constrained('referrals')->cascadeOnDelete();
            $table->foreignId('referrer_id')->constrained('investors')->cascadeOnDelete();
            $table->foreignId('referred_id')->constrained('investors')->cascadeOnDelete();
            $table->decimal('commission_amount', 15, 2);
            $table->date('payment_date');
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_commissions');
        Schema::dropIfExists('referrals');

        Schema::table('investors', function (Blueprint $table) {
            $table->dropColumn(['referral_code', 'referred_by_code']);
        });
    }

    private static function generateCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (\App\Models\Investor::withTrashed()->where('referral_code', $code)->exists());

        return $code;
    }
};
