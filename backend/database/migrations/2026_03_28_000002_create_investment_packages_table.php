<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investment_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('min_amount', 15, 2);
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->decimal('interest_rate', 8, 4);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        DB::table('investment_packages')->insert([
            [
                'name' => 'Starter',
                'min_amount' => 50000,
                'max_amount' => 149999,
                'interest_rate' => 0.1750,
                'features' => json_encode(['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Email notifications']),
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Growth',
                'min_amount' => 150000,
                'max_amount' => 499999,
                'interest_rate' => 0.2308,
                'features' => json_encode(['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Priority support', 'Email notifications']),
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Premium',
                'min_amount' => 500000,
                'max_amount' => null,
                'interest_rate' => 0.2500,
                'features' => json_encode(['Monthly interest payouts', '12-month contract', 'Investor portal access', 'Dedicated account manager', 'Priority support', 'Negotiable rates']),
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('investment_packages');
    }
};
