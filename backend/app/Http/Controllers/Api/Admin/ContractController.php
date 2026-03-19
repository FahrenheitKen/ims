<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Services\ActivityService;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContractController extends Controller
{
    public function __construct(private InvestmentService $investmentService) {}

    public function renew(Request $request, Investor $investor): JsonResponse
    {
        if ($investor->status !== 'completed') {
            return response()->json(['message' => 'Only completed contracts can be renewed'], 422);
        }

        $this->investmentService->renewContract($investor);

        ActivityService::log($request->user()->id, $investor->id, 'contract_renewed', 'Contract renewed for 12 months');

        return response()->json($investor->fresh());
    }
}
