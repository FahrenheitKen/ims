<?php

namespace App\Console\Commands;

use App\Services\InvestmentService;
use Illuminate\Console\Command;

class AutoCompleteContracts extends Command
{
    protected $signature = 'contracts:auto-complete';
    protected $description = 'Mark active contracts as completed when end date is reached and all payouts are paid';

    public function handle(): void
    {
        $count = InvestmentService::autoCompleteAllContracts();
        $this->info("Marked {$count} contract(s) as completed.");
    }
}
