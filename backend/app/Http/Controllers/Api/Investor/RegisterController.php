<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Services\InvestmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegisterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:10',
            'first_name' => 'required|string|max:255',
            'second_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'id_number' => 'required|string|unique:investors,id_number',
            'other_phone' => 'nullable|string|max:20',
            'email' => 'required|email|unique:investors,email',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:50',
            'next_of_kin_name' => 'nullable|string|max:255',
            'next_of_kin_phone' => 'nullable|string|max:20',
            'next_of_kin_relationship' => 'nullable|string|max:100',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:50',
            'bank_branch' => 'nullable|string|max:255',
            'initial_amount' => 'required|numeric|min:50000',
            'referral_code' => 'nullable|string|max:10|exists:investors,referral_code',
        ]);

        $investor = Investor::create([
            'investor_id' => InvestmentService::generateInvestorId(),
            'prefix' => $validated['prefix'] ?? null,
            'first_name' => $validated['first_name'],
            'second_name' => $validated['second_name'],
            'last_name' => $validated['last_name'] ?? null,
            'phone' => $validated['phone'],
            'id_number' => $validated['id_number'],
            'other_phone' => $validated['other_phone'] ?? null,
            'email' => $validated['email'],
            'address' => $validated['address'],
            'city' => $validated['city'],
            'country' => $validated['country'],
            'tax_id' => $validated['tax_id'] ?? null,
            'next_of_kin_name' => $validated['next_of_kin_name'] ?? null,
            'next_of_kin_phone' => $validated['next_of_kin_phone'] ?? null,
            'next_of_kin_relationship' => $validated['next_of_kin_relationship'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'bank_branch' => $validated['bank_branch'] ?? null,
            'total_invested' => $validated['initial_amount'],
            'interest_rate' => 0,
            'monthly_payout' => 0,
            'start_date' => now(),
            'end_date' => now()->addYear(),
            'password' => $validated['id_number'],
            'password_changed' => false,
            'status' => 'pending',
            'referred_by_code' => $validated['referral_code'] ?? null,
        ]);

        // Create referral record if a valid code was provided
        if (!empty($validated['referral_code'])) {
            $referrer = Investor::where('referral_code', $validated['referral_code'])->first();
            if ($referrer) {
                \App\Models\Referral::create([
                    'referrer_id' => $referrer->id,
                    'referred_id' => $investor->id,
                    'status' => 'pending',
                ]);
            }
        }

        return response()->json([
            'message' => 'Registration successful! Your account is pending admin approval. You will receive an email with login details once approved.',
            'investor' => $investor,
        ], 201);
    }
}
