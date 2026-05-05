<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
            default         => $items->sortBy(fn($i) => $i['type'] === 'folder' ? 0 : 1)->values(),
        };

        return response()->json([
            'success' => true,
            'data'    => $items,
        ]);
    }

    public function move(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file_ids' => 'nullable|array',
            'file_ids.*' => 'uuid|exists:files,id',
            'folder_ids' => 'nullable|array',
            'folder_ids.*' => 'uuid|exists:folders,id',
            'target_folder_id' => 'nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $userId = auth()->id();
        $targetFolderId = $request->target_folder_id;

        if ($targetFolderId) {
            $targetFolder = Folder::where('id', $targetFolderId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$targetFolder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target folder not found or access denied.',
                ], 404);
            }
        }

        if ($request->has('file_ids')) {
            File::whereIn('id', $request->file_ids)
                ->where('user_id', $userId)
                ->update(['folder_id' => $targetFolderId]);
        }

        if ($request->has('folder_ids')) {
            $folderIds = $request->folder_ids;
            
            if ($targetFolderId) {
                foreach ($folderIds as $id) {
                    if ($id === $targetFolderId) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot move a folder into itself.',
                        ], 422);
                    }
                    
                    if ($this->isDescendant($id, $targetFolderId)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot move a folder into its own descendant.',
                        ], 422);
                    }
                }
            }

            Folder::whereIn('id', $folderIds)
                ->where('user_id', $userId)
                ->update(['parent_id' => $targetFolderId]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Items moved successfully',
        ]);
    }

    private function isDescendant(string $folderId, string $targetFolderId): bool
    {
        $target = Folder::find($targetFolderId);
        while ($target && $target->parent_id) {
            if ($target->parent_id === $folderId) {
                return true;
            }
            $target = Folder::find($target->parent_id);
        }
        return false;
    }
}
