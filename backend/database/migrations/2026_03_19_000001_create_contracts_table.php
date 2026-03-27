<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained()->cascadeOnDelete();
            $table->string('contract_id')->unique();
            $table->decimal('total_invested', 15, 2)->default(0);
            $table->decimal('interest_rate', 8, 4)->default(0);
            $table->decimal('monthly_payout', 15, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'completed', 'deactivated', 'closed'])->default('active');
            $table->timestamps();
        });

        // Link payout_schedules to contracts
        Schema::table('payout_schedules', function (Blueprint $table) {
            $table->foreignId('contract_id')->nullable()->after('investor_id')->constrained()->cascadeOnDelete();
        });

        // Link investment_transactions to contracts
        Schema::table('investment_transactions', function (Blueprint $table) {
            $table->foreignId('contract_id')->nullable()->after('investor_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('investment_transactions', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn('contract_id');
        });

        Schema::table('payout_schedules', function (Blueprint $table) {
            $table->dropForeign(['contract_id']);
            $table->dropColumn('contract_id');
        });

        Schema::dropIfExists('contracts');
    }
};
