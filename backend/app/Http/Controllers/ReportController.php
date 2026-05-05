<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\File;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file_id' => 'required|uuid|exists:files,id',
            'reason' => 'required|string|max:255',
            'details' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $file = File::findOrFail($request->file_id);

        $report = Report::create([
            'reporter_id' => auth()->id(),
            'file_id' => $file->id,
            'reason' => $request->reason,
            'details' => $request->details,
            'status' => 'pending',
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'file_reported',
            'metadata' => [
                'report_id' => $report->id,
                'file_id' => $file->id,
                'reason' => $request->reason,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $report,
            'message' => 'Report submitted successfully',
        ], 201);
    }
}
