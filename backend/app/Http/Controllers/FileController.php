<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileActivity;
use App\Models\FileKeyword;
use App\Models\FileTag;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $folderId = $request->query('folder_id');
        $files = File::where('user_id', auth()->id())
            ->where('folder_id', $folderId)
            ->with('tags')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $files,
        ]);
    }

    public function upload(Request $request): JsonResponse
    {
        if (is_string($request->tags)) {
            $request->merge(['tags' => json_decode($request->tags, true)]);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:1048576',
            'name' => 'required|string|max:255',
            'mime_type' => 'required|string',
            'aes_key_encrypted' => 'required|string',
            'folder_id'    => ['nullable', 'uuid', Rule::exists('folders', 'id')->where('user_id', auth()->id())],
            'tags'         => 'nullable|array|max:50',
            'tags.*.name'  => 'required_with:tags|string|max:100',
            'tags.*.score' => 'required_with:tags|numeric|min:0',
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
        $mimeType = $request->mime_type;

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
                'message' => 'Batas penyimpanan terlampaui. Tersedia: ' . number_format($available / 1073741824, 2) . ' GB',
            ], 422);
        }

        $path = $request->file('file')->store('uploads', 'local');

        try {
            $file = File::create([
                'user_id'           => $userId,
                'folder_id'         => $folderId,
                'name'              => $name,
                'size'              => $request->file('file')->getSize(),
                'mime_type'         => $mimeType,
                'storage_path'      => $path,
                'aes_key_encrypted' => $request->aes_key_encrypted,
            ]);

            $tags = $request->tags ?? [];

            if (!empty($tags)) {
                FileTag::insert(
                    collect($tags)->map(fn($t) => [
                        'id'         => (string) Str::uuid(),
                        'file_id'    => $file->id,
                        'name'       => $t['name'],
                        'score'      => $t['score'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])->all()
                );
            }
            if ($request->has('keywords')) {
                $keywords = array_filter(
                    json_decode($request->keywords, true) ?? [],
                    fn($kw) => is_string($kw) && strlen(trim($kw)) > 0
                );
                if (!empty($keywords)) {
                    FileKeyword::insert(
                        array_map(fn($kw) => [
                            'id'      => (string) Str::uuid(),
                            'file_id' => $file->id,
                            'keyword' => trim($kw),
                        ], array_values($keywords))
                    );
                }
            }
        } catch (\Exception $e) {
            \Log::error('File upload failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            Storage::disk('local')->delete($path);
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengunggah file.',
            ], 500);
        }

        try {
            FileActivity::create([
                'user_id'   => $userId,
                'file_id'   => $file->id,
                'file_name' => $file->name,
                'mime_type' => $file->mime_type,
                'is_folder' => false,
                'action'    => 'uploaded',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (upload): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data'    => $file->load('tags'),
            'message' => 'File berhasil diunggah.',
        ], 201);
    }

    public function download(Request $request, string $id): StreamedResponse|JsonResponse
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
                'message' => 'File tidak ditemukan.',
            ], 404);
        }

        $aesKey = $file->aes_key_encrypted;
        if ($file->user_id !== $userId) {
            $share = $file->shares()->where('receiver_id', $userId)->first();
            if (!$share) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
            $aesKey = $share->aes_key_encrypted_for_receiver;
        }

        if (!Storage::disk('local')->exists($file->storage_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak ditemukan.',
            ], 404);
        }

        $action = $request->query('intent') === 'preview' ? 'opened' : 'downloaded';
        try {
            FileActivity::create([
                'user_id'   => $userId,
                'file_id'   => $file->id,
                'file_name' => $file->name,
                'mime_type' => $file->mime_type,
                'is_folder' => false,
                'action'    => $action,
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (download): ' . $e->getMessage());
        }

        $content = Storage::disk('local')->get($file->storage_path);

        return response()->stream(function() use ($content, $file, $aesKey) {
            echo json_encode([
                'aes_key_encrypted' => $aesKey,
                'encrypted_data' => base64_encode($content),
                'name' => $file->name,
                'mime_type' => $file->mime_type,
                'tags' => $file->tags,
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
        'folder_id' => ['nullable', 'uuid', Rule::exists('folders', 'id')->where('user_id', auth()->id())],
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

    if (isset($data['name'])) {
        try {
            FileActivity::create([
                'user_id'   => auth()->id(),
                'file_id'   => $file->id,
                'file_name' => $file->name,
                'mime_type' => $file->mime_type,
                'is_folder' => false,
                'action'    => 'renamed',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (rename): ' . $e->getMessage());
        }
    }

    return response()->json([
        'success' => true,
        'data' => $file,
        'message' => 'File berhasil diupdate.',
    ]);
}

    public function destroy(string $id): JsonResponse
    {
        $file = File::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $file->delete();

        try {
            FileActivity::create([
                'user_id'   => auth()->id(),
                'file_id'   => $file->id,
                'file_name' => $file->name,
                'mime_type' => $file->mime_type,
                'is_folder' => false,
                'action'    => 'trashed',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (trash): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'File dipindahkan ke sampah.',
        ]);
    }

    public function starred(): JsonResponse
    {
        $userId = auth()->id();
        $files = File::where('user_id', $userId)
            ->where('is_starred', true)
            ->with(['folder', 'tags'])
            ->get()
            ->map(function($f) {
                $arr = $f->toArray();
                $arr['type'] = 'file';
                return $arr;
            });

        $folders = Folder::where('user_id', $userId)
            ->where('is_starred', true)
            ->with('parent')
            ->get()
            ->map(function($f) {
                $arr = $f->toArray();
                $arr['type'] = 'folder';
                return $arr;
            });

        return response()->json([
            'success' => true,
            'data' => $folders->concat($files)->values(),
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
            ->where(function ($q) {
                $q->whereNull('folder_id')
                  ->orWhereHas('folder');
            })
            ->with(['folder', 'tags'])
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
            'message' => 'File berhasil dipulihkan.',
        ]);
    }

    public function forceDelete(string $id): JsonResponse
    {
        $file = File::onlyTrashed()->where('id', $id)->where('user_id', auth()->id())->firstOrFail();

        try {
            FileActivity::create([
                'user_id'   => auth()->id(),
                'file_id'   => null,
                'file_name' => $file->name,
                'mime_type' => $file->mime_type,
                'is_folder' => false,
                'action'    => 'deleted',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Activity log failed (force delete): ' . $e->getMessage());
        }

        Storage::disk('local')->delete($file->storage_path);
        $file->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'File berhasil dihapus permanen.',
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

    public function getKey(string $id): JsonResponse
    {
        $userId = auth()->id();
        $file = File::where('id', $id)
            ->where(function($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhereHas('shares', fn($s) => $s->where('receiver_id', $userId));
            })
            ->firstOrFail();

        $aesKey = $file->aes_key_encrypted;
        if ($file->user_id !== $userId) {
            $share = $file->shares()->where('receiver_id', $userId)->first();
            if (!$share) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
            $aesKey = $share->aes_key_encrypted_for_receiver;
        }

        return response()->json([
            'success' => true,
            'aes_key_encrypted' => $aesKey,
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

    public function storageBreakdown(): JsonResponse
    {
        $files = File::where('user_id', auth()->id())
            ->select('mime_type', 'size')
            ->get();

        $breakdown = ['images' => 0, 'videos' => 0, 'documents' => 0, 'others' => 0];

        foreach ($files as $file) {
            $mime = strtolower($file->mime_type ?? '');

            if (str_starts_with($mime, 'image/')) {
                $breakdown['images'] += $file->size;
            } elseif (str_starts_with($mime, 'video/')) {
                $breakdown['videos'] += $file->size;
            } elseif (
                $mime === 'application/pdf' ||
                str_starts_with($mime, 'text/') ||
                str_contains($mime, 'wordprocessingml') ||
                str_contains($mime, 'spreadsheetml') ||
                str_contains($mime, 'presentationml') ||
                str_contains($mime, 'msword') ||
                str_contains($mime, 'ms-excel') ||
                str_contains($mime, 'ms-powerpoint') ||
                str_contains($mime, 'opendocument')
            ) {
                $breakdown['documents'] += $file->size;
            } else {
                $breakdown['others'] += $file->size;
            }
        }

        $largest = File::where('user_id', auth()->id())
            ->orderByDesc('size')
            ->limit(5)
            ->select('name', 'size', 'mime_type')
            ->get()
            ->map(fn($f) => ['name' => $f->name, 'size' => $f->size, 'mime_type' => $f->mime_type]);

        return response()->json([
            'success' => true,
            'data' => [
                'breakdown' => $breakdown,
                'largest_files' => $largest,
            ],
        ]);
    }
}
