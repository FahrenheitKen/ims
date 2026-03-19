<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Investor;
use App\Services\ActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Investor $investor): JsonResponse
    {
        $documents = $investor->documents()->orderBy('uploaded_at', 'desc')->get();
        return response()->json($documents);
    }

    public function store(Request $request, Investor $investor): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store("investors/{$investor->id}/documents", 's3');

        $document = Document::create([
            'investor_id' => $investor->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'uploaded_at' => now(),
        ]);

        ActivityService::log($request->user()->id, $investor->id, 'document_uploaded', "Uploaded: {$file->getClientOriginalName()}");

        return response()->json($document, 201);
    }

    public function download(Document $document): mixed
    {
        return Storage::disk('s3')->download($document->file_path, $document->file_name);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        ActivityService::log($request->user()->id, $document->investor_id, 'document_deleted', "Deleted: {$document->file_name}");
        $document->delete();

        return response()->json(['message' => 'Document deleted']);
    }
}
