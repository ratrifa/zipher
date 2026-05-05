<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileTag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
        // tags may arrive as a JSON string in multipart uploads
        if (is_string($request->tags)) {
            $request->merge(['tags' => json_decode($request->tags, true)]);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:524288', // 512MB
            'name' => 'required|string|max:255',
            'mime_type' => 'required|string',
            'aes_key_encrypted' => 'required|string',
            'folder_id'   => 'nullable|uuid|exists:folders,id',
            'tags'        => 'nullable|array|max:50',
            'tags.*.name' => 'required_with:tags|string|max:100',
            'tags.*.score'=> 'required_with:tags|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $userId = auth()->id();
        $folderId = $request->folder_id;
        $name = $request->name;

        $originalName = pathinfo($name, PATHINFO_FILENAME);
        $extension = pathinfo($name, PATHINFO_EXTENSION);
        $extension = $extension ? "." . $extension : "";
        $counter = 1;

        while (File::where('user_id', $userId)
            ->where('folder_id', $folderId)
            ->where('name', $name)
            ->exists()) {
            $name = $originalName . " ($counter)" . $extension;
            $counter++;
        }

        $user = auth()->user();
        $incomingSize = $request->file('file')->getSize();

        if ($user->storageUsed() + $incomingSize > $user->storage_limit) {
            $available = $user->storage_limit - $user->storageUsed();
            return response()->json([
                'success' => false,
                'message' => 'Storage limit exceeded. Available: ' . number_format($available / 1073741824, 2) . ' GB',
            ], 422);
        }

        $path = $request->file('file')->store('uploads', 'public');

        $file = File::create([
            'user_id' => $userId,
            'folder_id' => $folderId,
            'name' => $name,
            'size' => $request->file('file')->getSize(),
            'mime_type' => $request->mime_type,
            'storage_path' => $path,
            'aes_key_encrypted' => $request->aes_key_encrypted,
        ]);

        if ($request->filled('tags')) {
            FileTag::insert(
                collect($request->tags)->map(fn($t) => [
                    'id'         => (string) Str::uuid(),
                    'file_id'    => $file->id,
                    'name'       => $t['name'],
                    'score'      => $t['score'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all()
            );
        }

        return response()->json([
            'success' => true,
            'data'    => $file->load('tags'),
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
        'folder_id' => 'nullable|uuid|exists:folders,id',
        'is_starred' => 'sometimes|boolean',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
        ], 422);
    }

    $data = $request->only('folder_id', 'is_starred');

    if ($request->has('name')) {
        $userId = auth()->id();
        $folderId = $request->has('folder_id') ? $request->folder_id : $file->folder_id;
        $name = $request->name;

        $originalName = pathinfo($name, PATHINFO_FILENAME);
        $extension = pathinfo($name, PATHINFO_EXTENSION);
        $extension = $extension ? "." . $extension : "";
        $counter = 1;

        while (File::where('user_id', $userId)
            ->where('folder_id', $folderId)
            ->where('name', $name)
            ->where('id', '!=', $file->id)
            ->exists()) {
            $name = $originalName . " ($counter)" . $extension;
            $counter++;
        }
        $data['name'] = $name;
    }

    $file->update($data);

    return response()->json([
        'success' => true,
        'data' => $file,
        'message' => 'File updated successfully',
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
        $files = File::onlyTrashed()
            ->where('user_id', auth()->id())
            ->with('folder')
            ->orderBy('deleted_at', 'desc')
            ->get();

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

    public function tags(string $id): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $file->tags,
        ]);
    }

    public function replaceTags(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'tags'        => 'required|array',
            'tags.*.name' => 'required|string|max:100',
            'tags.*.score'=> 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        DB::transaction(function () use ($file, $request) {
            FileTag::where('file_id', $file->id)->delete();

            if (!empty($request->tags)) {
                FileTag::insert(
                    collect($request->tags)->map(fn($t) => [
                        'id'         => (string) Str::uuid(),
                        'file_id'    => $file->id,
                        'name'       => $t['name'],
                        'score'      => $t['score'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])->all()
                );
            }
        });

        return response()->json([
            'success' => true,
            'data'    => $file->fresh()->load('tags'),
        ]);
    }

    public function destroyTag(string $id, string $tagId): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $tag  = FileTag::where('id', $tagId)->where('file_id', $file->id)->firstOrFail();
        $tag->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tag removed',
        ]);
    }
}
