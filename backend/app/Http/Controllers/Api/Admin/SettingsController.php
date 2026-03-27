<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::pluck('value', 'key');

        return response()->json([
            'app_name' => $settings['app_name'] ?? 'KAP IMS',
            'app_logo' => $settings['app_logo'] ?? null,
            'whatsapp_number' => $settings['whatsapp_number'] ?? null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_logo' => 'nullable|image|mimes:png,jpg,jpeg,svg,webp|max:2048',
            'remove_logo' => 'nullable|boolean',
            'whatsapp_number' => 'nullable|string|max:20',
        ]);

        Setting::set('app_name', $request->input('app_name'));

        if ($request->has('whatsapp_number')) {
            Setting::set('whatsapp_number', $request->input('whatsapp_number'));
        }

        if ($request->boolean('remove_logo')) {
            $oldLogo = Setting::get('app_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }
            Setting::set('app_logo', null);
        } elseif ($request->hasFile('app_logo')) {
            // Delete old logo
            $oldLogo = Setting::get('app_logo');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('app_logo')->store('logos', 'public');
            Setting::set('app_logo', $path);
        }

        $settings = Setting::pluck('value', 'key');

        return response()->json([
            'app_name' => $settings['app_name'] ?? 'KAP IMS',
            'app_logo' => $settings['app_logo'] ?? null,
            'whatsapp_number' => $settings['whatsapp_number'] ?? null,
            'message' => 'Settings updated successfully',
        ]);
    }
}
