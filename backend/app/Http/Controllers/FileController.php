<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $folderId = $request->query('folder_id');
        $files = File::where('user_id', auth()->id())
            ->where('folder_id', $folderId)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:524288', // 512MB
            'name' => 'required|string|max:255',
            'mime_type' => 'required|string',
            'aes_key_encrypted' => 'required|string',
            'folder_id' => 'nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $path = $request->file('file')->store('uploads', 'public');

        $file = File::create([
            'user_id' => auth()->id(),
            'folder_id' => $request->folder_id,
            'name' => $request->name,
            'size' => $request->file('file')->getSize(),
            'mime_type' => $request->mime_type,
            'storage_path' => $path,
            'aes_key_encrypted' => $request->aes_key_encrypted,
        ]);

        return response()->json([
            'success' => true,
            'data' => $file,
            'message' => 'File uploaded successfully',
        ], 201);
    }

    public function download(string $id): StreamedResponse|JsonResponse
    {
        $userId = auth()->id();
        $file = File::where('id', $id)
            ->where(function($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('shares', fn($s) => $s->where('receiver_id', $userId));
            })
            ->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        $aesKey = $file->aes_key_encrypted;
        if ($file->user_id !== $userId) {
            $share = $file->shares()->where('receiver_id', $userId)->first();
            $aesKey = $share->aes_key_encrypted_for_receiver;
        }

        if (!Storage::disk('public')->exists($file->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'Physical file not found',
            ], 404);
        }

        $content = Storage::disk('public')->get($file->storage_path);

        return response()->stream(function() use ($content, $file, $aesKey) {
            echo json_encode([
                'aes_key_encrypted' => $aesKey,
                'encrypted_data' => base64_encode($content),
                'name' => $file->name,
                'mime_type' => $file->mime_type,
            ]);
        }, 200, [
            'Content-Type' => 'application/json',
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'folder_id' => 'sometimes|nullable|uuid|exists:folders,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $file->update($request->only('name', 'folder_id'));

        return response()->json([
            'success' => true,
            'data' => $file,
            'message' => 'File updated',
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $file->delete();

        return response()->json([
            'success' => true,
            'message' => 'File moved to trash',
        ]);
    }

    public function starred(): JsonResponse
    {
        $files = File::where('user_id', auth()->id())
            ->where('is_starred', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function toggleStar(string $id): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $file->update(['is_starred' => !$file->is_starred]);

        return response()->json([
            'success' => true,
            'data' => ['is_starred' => $file->is_starred],
        ]);
    }

    public function trash(): JsonResponse
    {
        $files = File::onlyTrashed()->where('user_id', auth()->id())->get();

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function restore(string $id): JsonResponse
    {
        $file = File::onlyTrashed()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $file->restore();

        return response()->json([
            'success' => true,
            'message' => 'File restored',
        ]);
    }

    public function forceDelete(string $id): JsonResponse
    {
        $file = File::onlyTrashed()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        Storage::disk('public')->delete($file->storage_path);
        $file->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'File permanently deleted',
        ]);
    }
}
