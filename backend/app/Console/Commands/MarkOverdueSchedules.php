<?php

namespace App\Console\Commands;

use App\Services\PayoutService;
use Illuminate\Console\Command;

class MarkOverdueSchedules extends Command
{
    protected $signature = 'schedules:mark-overdue';
    protected $description = 'Mark pending payout schedules as overdue if past due date';

    public function handle(): void
    {
        $count = PayoutService::markOverdueSchedules();
        $this->info("Marked {$count} schedule(s) as overdue.");
    }
}
