<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user('investor');

        $payments = $investor->payments()
            ->with('allocations.payoutSchedule')
            ->orderBy('payment_date', 'desc')
            ->paginate(15);

        return response()->json($payments);
    }
}
