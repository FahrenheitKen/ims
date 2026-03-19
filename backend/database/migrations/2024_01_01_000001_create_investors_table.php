<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investors', function (Blueprint $table) {
            $table->id();
            $table->string('investor_id')->unique();
            $table->string('prefix')->nullable();
            $table->string('first_name');
            $table->string('second_name');
            $table->string('last_name')->nullable();
            $table->string('phone');
            $table->string('id_number')->unique();
            $table->string('other_phone')->nullable();
            $table->string('email')->unique();
            $table->string('address');
            $table->string('city');
            $table->string('country');
            $table->string('tax_id')->nullable();
            $table->string('next_of_kin_name')->nullable();
            $table->string('next_of_kin_phone')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('bank_branch')->nullable();
            $table->decimal('total_invested', 15, 2)->default(0);
            $table->decimal('interest_rate', 8, 4)->default(0);
            $table->decimal('monthly_payout', 15, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('password');
            $table->boolean('password_changed')->default(false);
            $table->enum('status', ['active', 'deactivated', 'completed', 'closed'])->default('active');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investors');
    }
};
