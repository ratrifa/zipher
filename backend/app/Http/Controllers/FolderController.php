<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileActivity;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FolderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $parentId = $request->query('parent_id');
        $folders = Folder::where('user_id', auth()->id())
            ->where('parent_id', $parentId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $folders,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $name = $request->name;
        $parentId = $request->parent_id;
        $userId = auth()->id();

        $folder = Folder::where('user_id', $userId)
            ->where('parent_id', $parentId)
            ->where('name', $name)
            ->first();

        if ($folder) {
            return response()->json([
                'success' => true,
                'data' => $folder,
                'message' => 'Folder already exists, using existing one',
            ], 200);
        }

        $folder = Folder::create([
            'name' => $name,
            'user_id' => $userId,
            'parent_id' => $parentId,
        ]);

        try {
            FileActivity::create([
                'user_id'   => $userId,
                'file_id'   => null,
                'file_name' => $folder->name,
                'mime_type' => null,
                'is_folder' => true,
                'action'    => 'created',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (folder create): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $folder,
            'message' => 'Folder created successfully',
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $folder = Folder::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $name = $request->name;
        $parentId = $request->has('parent_id') ? $request->parent_id : $folder->parent_id;
        $userId = auth()->id();

        if ($parentId !== null) {
            if ($parentId === $folder->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'A folder cannot be its own parent.',
                ], 422);
            }

            if ($this->isDescendant($folder->id, $parentId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot move a folder into its own descendant.',
                ], 422);
            }
        }

        $originalName = $name;
        $counter = 1;

        while (Folder::where('user_id', $userId)
            ->where('parent_id', $parentId)
            ->where('name', $name)
            ->where('id', '!=', $folder->id)
            ->exists()) {
            $name = $originalName . " ($counter)";
            $counter++;
        }

        $folder->update([
            'name' => $name,
            'parent_id' => $parentId,
        ]);

        if ($request->has('name')) {
            try {
                FileActivity::create([
                    'user_id'   => $userId,
                    'file_id'   => null,
                    'file_name' => $folder->name,
                    'mime_type' => null,
                    'is_folder' => true,
                    'action'    => 'renamed',
                ]);
            } catch (\Exception $e) {
                \Log::warning('Activity log failed (folder rename): ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => $folder,
            'message' => 'Folder updated successfully',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $folder = Folder::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $this->softDeleteDescendants($folder);
        $folder->delete();

        try {
            FileActivity::create([
                'user_id'   => auth()->id(),
                'file_id'   => null,
                'file_name' => $folder->name,
                'mime_type' => null,
                'is_folder' => true,
                'action'    => 'trashed',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (folder trash): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Folder moved to trash',
        ]);
    }

    public function trash(): JsonResponse
    {
        $folders = Folder::onlyTrashed()
            ->where('user_id', auth()->id())
            ->with('parent')
            ->orderBy('deleted_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $folders,
        ]);
    }

    public function restore(string $id): JsonResponse
    {
        $folder = Folder::onlyTrashed()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $this->restoreDescendants($folder);
        $folder->restore();

        return response()->json([
            'success' => true,
            'message' => 'Folder restored',
        ]);
    }

    public function forceDelete(string $id): JsonResponse
    {
        $folder = Folder::onlyTrashed()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        try {
            FileActivity::create([
                'user_id'   => auth()->id(),
                'file_id'   => null,
                'file_name' => $folder->name,
                'mime_type' => null,
                'is_folder' => true,
                'action'    => 'deleted',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (folder delete): ' . $e->getMessage());
        }

        $this->forceDeleteDescendants($folder);
        $folder->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Folder permanently deleted',
        ]);
    }

    public function toggleStar(string $id): JsonResponse
    {
        $folder = Folder::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $folder->update(['is_starred' => !$folder->is_starred]);

        return response()->json([
            'success' => true,
            'data' => ['is_starred' => $folder->is_starred],
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

    private function softDeleteDescendants(Folder $folder): void
    {
        File::where('folder_id', $folder->id)->delete();
        $children = Folder::where('parent_id', $folder->id)->get();
        foreach ($children as $child) {
            $this->softDeleteDescendants($child);
            $child->delete();
        }
    }

    private function restoreDescendants(Folder $folder): void
    {
        File::onlyTrashed()->where('folder_id', $folder->id)->restore();
        $children = Folder::onlyTrashed()->where('parent_id', $folder->id)->get();
        foreach ($children as $child) {
            $this->restoreDescendants($child);
            $child->restore();
        }
    }

    private function forceDeleteDescendants(Folder $folder): void
    {
        File::onlyTrashed()->where('folder_id', $folder->id)->forceDelete();
        $children = Folder::onlyTrashed()->where('parent_id', $folder->id)->get();
        foreach ($children as $child) {
            $this->forceDeleteDescendants($child);
            $child->forceDelete();
        }
    }
}
