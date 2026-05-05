<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityResource;
use App\Models\ActivityLog;
use App\Models\File;
use App\Models\Folder;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => User::count(),
                'total_files' => File::count(),
                'total_folders' => Folder::count(),
                'total_reports' => Report::count(),
                'pending_reports' => Report::where('status', 'pending')->count(),
                'total_activity_logs' => ActivityLog::count(),
                'total_storage_used' => File::sum('size'),
            ],
        ]);
    }

    public function recentReports(): JsonResponse
    {
        $reports = Report::with(['reporter:id,username,email', 'file:id,name,user_id'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reports,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = $request->query('q');
        $perPage = min((int) $request->query('per_page', 20), 100);

        $users = User::select('id', 'username', 'email', 'role', 'is_banned', 'created_at')
            ->when($query, fn($q) => $q->where('username', 'LIKE', "%{$query}%")
                ->orWhere('email', 'LIKE', "%{$query}%"))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function activity(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);
        $logs = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ActivityResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function showReport(string $id): JsonResponse
    {
        $report = Report::with(['reporter:id,username,email', 'file:id,name,user_id', 'reviewedBy:id,username,email'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function reviewReport(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,reviewed,dismissed',
            'review_note' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $report = Report::findOrFail($id);
        $report->update([
            'status' => $request->status,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'report_reviewed',
            'metadata' => [
                'report_id' => $report->id,
                'status' => $request->status,
                'review_note' => $request->review_note,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $report,
            'message' => 'Report successfully reviewed',
        ]);
    }

    public function banUser(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_banned' => true]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_banned',
            'metadata' => [
                'banned_user_id' => $user->id,
                'banned_user_email' => $user->email,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User banned successfully',
        ]);
    }

    public function unbanUser(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_banned' => false]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_unbanned',
            'metadata' => [
                'unbanned_user_id' => $user->id,
                'unbanned_user_email' => $user->email,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User unbanned successfully',
        ]);
    }
}
