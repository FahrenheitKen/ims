<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $schedules = $investor->payoutSchedules()
            ->orderBy('due_date')
            ->get();

        return response()->json($schedules);
    }
}
