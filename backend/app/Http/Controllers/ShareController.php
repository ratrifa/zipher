<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\SharedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ShareController extends Controller
{
    public function share(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file_id' => 'required|uuid|exists:files,id',
            'receiver_id' => 'required|uuid|exists:users,id',
            'aes_key_encrypted_for_receiver' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $file = File::where('id', $request->file_id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        if ($request->receiver_id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot share with yourself',
            ], 422);
        }

        $shared = SharedFile::updateOrCreate(
            [
                'file_id' => $file->id,
                'receiver_id' => $request->receiver_id,
            ],
            [
                'owner_id' => auth()->id(),
                'aes_key_encrypted_for_receiver' => $request->aes_key_encrypted_for_receiver,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $shared,
            'message' => 'File shared successfully',
        ], 201);
    }

    public function sharedWithMe(): JsonResponse
    {
        $shared = SharedFile::where('receiver_id', auth()->id())
            ->with(['file', 'owner:id,username,email'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $shared,
        ]);
    }

    public function sharedByMe(): JsonResponse
    {
        $shared = SharedFile::where('owner_id', auth()->id())
            ->with(['file', 'receiver:id,username,email'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $shared,
        ]);
    }

    public function revoke(string $id): JsonResponse
    {
        $shared = SharedFile::where('id', $id)
            ->where('owner_id', auth()->id())
            ->firstOrFail();

        $shared->delete();

        return response()->json([
            'success' => true,
            'message' => 'Access revoked',
        ]);
    }
}
