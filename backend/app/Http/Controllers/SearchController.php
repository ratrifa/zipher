<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q'         => 'required|string|min:1|max:255',
            'mime_type' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $userId   = auth()->id();
        $tokens   = array_filter(preg_split('/\s+/', trim($request->q)));
        $mimeType = $request->query('mime_type');

        $filesQuery = File::where('user_id', $userId);
        foreach ($tokens as $token) {
            $filesQuery->where('name', 'LIKE', '%' . $token . '%');
        }
        if ($mimeType) {
            str_contains($mimeType, '/')
                ? $filesQuery->where('mime_type', $mimeType)
                : $filesQuery->where('mime_type', 'LIKE', $mimeType . '/%');
        }
        $files = $filesQuery->get()->map(fn($f) => array_merge($f->toArray(), ['type' => 'file']));

        $foldersQuery = Folder::where('user_id', $userId);
        foreach ($tokens as $token) {
            $foldersQuery->where('name', 'LIKE', '%' . $token . '%');
        }
        $folders = $foldersQuery->get()->map(fn($f) => array_merge($f->toArray(), ['type' => 'folder']));

        $results = $folders->concat($files)
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }
}
