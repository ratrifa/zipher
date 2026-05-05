<?php

namespace App\Http\Controllers;

use App\Models\File;
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

        $originalName = $name;
        $counter = 1;

        while (Folder::where('user_id', $userId)
            ->where('parent_id', $parentId)
            ->where('name', $name)
            ->exists()) {
            $name = $originalName . " ($counter)";
            $counter++;
        }

        $folder = Folder::create([
            'name' => $name,
            'user_id' => $userId,
            'parent_id' => $parentId,
        ]);

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
        $this->forceDeleteDescendants($folder);
        $folder->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'Folder permanently deleted',
        ]);
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
