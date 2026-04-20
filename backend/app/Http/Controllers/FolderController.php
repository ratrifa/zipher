<?php

namespace App\Http\Controllers;

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

        $folder = Folder::create([
            'name' => $request->name,
            'user_id' => auth()->id(),
            'parent_id' => $request->parent_id,
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
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'sometimes|nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $folder->update($request->only('name', 'parent_id'));

        return response()->json([
            'success' => true,
            'data' => $folder,
            'message' => 'Folder updated',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $folder = Folder::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $folder->delete();

        return response()->json([
            'success' => true,
            'message' => 'Folder deleted',
        ]);
    }
}
