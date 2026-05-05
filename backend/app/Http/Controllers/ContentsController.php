<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId   = auth()->id();
        $folderId = $request->query('folder_id');
        $sort     = $request->query('sort', 'folders_first');

        $folders = Folder::where('user_id', $userId)
            ->where('parent_id', $folderId)
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['type' => 'folder']));

        $files = File::where('user_id', $userId)
            ->where('folder_id', $folderId)
            ->get()
            ->map(fn($f) => array_merge($f->toArray(), ['type' => 'file']));

        $items = $folders->concat($files);

        $items = match ($sort) {
            'name_asc'      => $items->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values(),
            'name_desc'     => $items->sortByDesc('name', SORT_NATURAL | SORT_FLAG_CASE)->values(),
            'size_asc'      => $items->sortBy('size')->values(),
            'size_desc'     => $items->sortByDesc('size')->values(),
            'date_asc'      => $items->sortBy('updated_at')->values(),
            'date_desc'     => $items->sortByDesc('updated_at')->values(),
            'files_first'   => $items->sortBy(fn($i) => $i['type'] === 'file' ? 0 : 1)->values(),
            default         => $items->sortBy(fn($i) => $i['type'] === 'folder' ? 0 : 1)->values(), // folders_first
        };

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }
}
