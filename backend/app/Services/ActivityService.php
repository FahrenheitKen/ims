<?php

namespace App\Services;

use App\Models\Activity;

class ActivityService
{
    public static function log(?int $userId, ?int $investorId, string $action, ?string $details = null): Activity
    {
        return Activity::create([
            'user_id' => $userId,
            'investor_id' => $investorId,
            'action' => $action,
            'details' => $details,
            'performed_at' => now(),
        ]);
    }
}
