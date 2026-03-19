<?php

namespace App\Http\Controllers\Api\Investor;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $investor = $request->user('investor');
        $documents = $investor->documents()->orderBy('uploaded_at', 'desc')->get();

        return response()->json($documents);
    }

    public function download(Request $request, Document $document): mixed
    {
        $investor = $request->user('investor');

        if ($document->investor_id !== $investor->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Storage::disk('s3')->download($document->file_path, $document->file_name);
    }
}
