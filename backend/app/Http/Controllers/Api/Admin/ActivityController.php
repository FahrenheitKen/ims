<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use Illuminate\Http\JsonResponse;

class ActivityController extends Controller
{
    public function index(Investor $investor): JsonResponse
    {
        $activities = $investor->activities()
            ->with('user:id,name')
            ->orderBy('performed_at', 'desc')
            ->paginate(20);

        return response()->json($activities);
    }
}
