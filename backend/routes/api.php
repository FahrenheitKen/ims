<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\Investor;
// Admin sub-controllers imported via namespace
use Illuminate\Support\Facades\Route;

// Public settings (needed by login pages and landing page)
Route::get('/settings', [Admin\SettingsController::class, 'index']);
Route::get('/investment-packages', [Admin\InvestmentPackageController::class, 'publicIndex']);

// Admin Auth (public)
Route::post('/admin/login', [Admin\AuthController::class, 'login']);

// Investor Auth (public)
Route::post('/investor/login', [Investor\AuthController::class, 'login']);
Route::post('/investor/register', [Investor\RegisterController::class, 'store']);
Route::post('/investor/forgot-password', [Investor\AuthController::class, 'forgotPassword']);
Route::post('/investor/reset-password', [Investor\AuthController::class, 'resetPassword']);

// Admin Routes (protected)
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/logout', [Admin\AuthController::class, 'logout']);
    Route::get('/user', [Admin\AuthController::class, 'user']);
    Route::put('/profile', [Admin\AuthController::class, 'updateProfile']);
    Route::post('/change-password', [Admin\AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [Admin\DashboardController::class, 'index']);
    Route::get('/dashboard/calendar', [Admin\DashboardController::class, 'calendar']);
    Route::get('/notifications', [Admin\DashboardController::class, 'notifications']);

    // Investors
    Route::get('/investors', [Admin\InvestorController::class, 'index']);
    Route::post('/investors', [Admin\InvestorController::class, 'store']);
    Route::get('/investors/{investor}', [Admin\InvestorController::class, 'show']);
    Route::put('/investors/{investor}', [Admin\InvestorController::class, 'update']);
    Route::delete('/investors/{investor}', [Admin\InvestorController::class, 'destroy']);
    Route::patch('/investors/{investor}/deactivate', [Admin\InvestorController::class, 'deactivate']);
    Route::patch('/investors/{investor}/reactivate', [Admin\InvestorController::class, 'reactivate']);
    Route::patch('/investors/{investor}/approve', [Admin\InvestorController::class, 'approve']);
    Route::delete('/investors/{investor}/reject', [Admin\InvestorController::class, 'reject']);

    // Top ups
    Route::post('/investors/{investor}/topup', [Admin\TopUpController::class, 'store']);

    // Payments
    Route::get('/investors/{investor}/payments', [Admin\PaymentController::class, 'index']);
    Route::post('/investors/{investor}/payments', [Admin\PaymentController::class, 'store']);
    Route::put('/investors/{investor}/payments/{payment}', [Admin\PaymentController::class, 'update']);
    Route::delete('/investors/{investor}/payments/{payment}', [Admin\PaymentController::class, 'destroy']);
    Route::get('/investors/{investor}/payment-summary', [Admin\PaymentController::class, 'summary']);

    // Schedules (Ledger) & Statement
    Route::get('/investors/{investor}/schedules', [Admin\ScheduleController::class, 'index']);
    Route::get('/investors/{investor}/statement', [Admin\ScheduleController::class, 'statement']);

    // Documents
    Route::get('/investors/{investor}/documents', [Admin\DocumentController::class, 'index']);
    Route::post('/investors/{investor}/documents', [Admin\DocumentController::class, 'store']);
    Route::get('/documents/{document}/download', [Admin\DocumentController::class, 'download']);
    Route::delete('/documents/{document}', [Admin\DocumentController::class, 'destroy']);

    // Activities
    Route::get('/investors/{investor}/activities', [Admin\ActivityController::class, 'index']);

    // Referrals
    Route::get('/investors/{investor}/referrals', [Admin\InvestorController::class, 'referrals']);

    // Contracts
    Route::get('/contracts', [Admin\ContractController::class, 'index']);
    Route::get('/contracts/{contract}', [Admin\ContractController::class, 'show']);
    Route::get('/investors/{investor}/contracts', [Admin\ContractController::class, 'investorContracts']);
    Route::post('/investors/{investor}/contracts', [Admin\ContractController::class, 'store']);
    Route::post('/investors/{investor}/renew', [Admin\ContractController::class, 'renew']);

    // Topup Requests
    Route::get('/topup-requests', [Admin\TopupRequestController::class, 'index']);
    Route::patch('/topup-requests/{topupRequest}/approve', [Admin\TopupRequestController::class, 'approve']);
    Route::patch('/topup-requests/{topupRequest}/reject', [Admin\TopupRequestController::class, 'reject']);

    // New Contract Requests
    Route::get('/new-contract-requests', [Admin\NewContractRequestController::class, 'index']);
    Route::patch('/new-contract-requests/{newContractRequest}/approve', [Admin\NewContractRequestController::class, 'approve']);
    Route::patch('/new-contract-requests/{newContractRequest}/reject', [Admin\NewContractRequestController::class, 'reject']);

    // Reports
    Route::get('/reports/monthly-payout', [Admin\ReportController::class, 'monthlyPayout']);
    Route::get('/reports/overdue', [Admin\ReportController::class, 'overdue']);

    // Settings
    Route::get('/settings', [Admin\SettingsController::class, 'index']);
    Route::post('/settings', [Admin\SettingsController::class, 'update']);
    Route::post('/settings/commission', [Admin\SettingsController::class, 'updateCommission']);

    // Investment Packages
    Route::get('/investment-packages', [Admin\InvestmentPackageController::class, 'index']);
    Route::post('/investment-packages', [Admin\InvestmentPackageController::class, 'store']);
    Route::put('/investment-packages/{package}', [Admin\InvestmentPackageController::class, 'update']);
    Route::delete('/investment-packages/{package}', [Admin\InvestmentPackageController::class, 'destroy']);
});

// Investor Portal Routes (protected)
Route::prefix('investor')->middleware(['auth:investor'])->group(function () {
    Route::post('/logout', [Investor\AuthController::class, 'logout']);
    Route::get('/user', [Investor\AuthController::class, 'user']);
    Route::post('/change-password', [Investor\AuthController::class, 'changePassword']);

    Route::get('/dashboard', [Investor\DashboardController::class, 'index']);
    Route::get('/schedules', [Investor\ScheduleController::class, 'index']);
    Route::get('/payments', [Investor\PaymentController::class, 'index']);
    Route::get('/documents', [Investor\DocumentController::class, 'index']);
    Route::get('/documents/{document}/download', [Investor\DocumentController::class, 'download']);

    Route::get('/referrals', [Investor\ReferralController::class, 'index']);

    Route::get('/contracts', [Investor\ContractController::class, 'index']);
    Route::get('/contracts/{id}', [Investor\ContractController::class, 'show']);
    Route::post('/contracts/{id}/topup-request', [Investor\ContractController::class, 'topupRequest']);
    Route::get('/topup-requests', [Investor\ContractController::class, 'myTopupRequests']);
    Route::post('/new-contract-request', [Investor\ContractController::class, 'newContractRequest']);
    Route::get('/new-contract-requests', [Investor\ContractController::class, 'myNewContractRequests']);
});
