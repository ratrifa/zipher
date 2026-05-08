<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\SharedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'share_id' => 'required|uuid|exists:shared_files,id',
            'reason'   => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $share = SharedFile::find($request->share_id);

        if ($share->receiver_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $alreadyReported = Report::where('reporter_id', auth()->id())
            ->where('share_id', $request->share_id)
            ->exists();

        if ($alreadyReported) {
            return response()->json([
                'success' => false,
                'message' => 'Sudah pernah melaporkan file ini.',
            ], 422);
        }

        Report::create([
            'share_id'    => $share->id,
            'file_id'     => $share->file_id,
            'reporter_id' => auth()->id(),
            'reason'      => $request->reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dikirim.',
        ], 201);
    }
}
