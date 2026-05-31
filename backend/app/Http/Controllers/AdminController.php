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
        $mostReportedUser = User::query()
            ->select('users.id', 'users.username')
            ->join('files', 'files.user_id', '=', 'users.id')
            ->join('reports', 'reports.file_id', '=', 'files.id')
            ->groupBy('users.id', 'users.username')
            ->orderByRaw('COUNT(reports.id) DESC')
            ->selectRaw('COUNT(reports.id) as report_count')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => User::where('is_banned', false)->count(),
                'total_files' => File::count(),
                'total_folders' => Folder::count(),
                'banned_users' => User::where('is_banned', true)->count(),
                'total_reports' => Report::count(),
                'pending_reports' => Report::where('status', 'pending')->count(),
                'total_activity_logs' => ActivityLog::count(),
                'total_storage_used' => File::sum('size'),
                'most_reported_user' => $mostReportedUser ? [
                    'id' => $mostReportedUser->id,
                    'username' => $mostReportedUser->username,
                    'report_count' => (int) $mostReportedUser->report_count,
                ] : null,
            ],
        ]);
    }

    public function recentReports(): JsonResponse
    {
        $reports = Report::with(['reporter:id,username,email', 'file:id,name,user_id', 'file.user:id,username'])
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
            ->withCount(['files as files_count' => fn($q) => $q->withTrashed(), 'reportsReceived'])
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
            'status' => 'required|in:reviewed,dismissed',
            'review_note' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $report = Report::findOrFail($id);

        if ($request->status === 'dismissed') {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'report_dismissed',
                'metadata' => [
                    'report_id' => $report->id,
                    'file_id' => $report->file_id,
                ],
            ]);

            $report->delete();

            return response()->json([
                'success' => true,
                'message' => 'Laporan berhasil diabaikan dan dihapus.',
            ]);
        }

        $report->update([
            'status' => 'reviewed',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'report_reviewed',
            'metadata' => [
                'report_id' => $report->id,
                'status' => 'reviewed',
                'review_note' => $request->review_note,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => $report,
            'message' => 'Laporan berhasil ditandai sebagai telah ditinjau.',
        ]);
    }

    public function banUser(string $id, Request $request): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat mem-banned dirinya sendiri.',
            ], 422);
        }

        if ($user->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak dapat di-banned.',
            ], 422);
        }

        \App\Models\EmailBlacklist::firstOrCreate(['email' => $user->email]);

        $user->tokens()->delete();

        $files = File::where('user_id', $user->id)->withTrashed()->get();
        foreach ($files as $file) {
            if ($file->storage_path) {
                \Illuminate\Support\Facades\Storage::disk('local')->delete($file->storage_path);
            }
            $file->forceDelete();
        }

        \App\Models\Folder::where('user_id', $user->id)->withTrashed()->forceDelete();

        \App\Models\SharedFile::where('owner_id', $user->id)
            ->orWhere('receiver_id', $user->id)
            ->delete();

        $user->forceFill(['is_banned' => true])->save();

        if ($request->has('report_id')) {
            Report::where('status', 'pending')
                ->whereHas('file', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->update([
                    'status' => 'reviewed',
                    'reviewed_by' => auth()->id(),
                    'reviewed_at' => now(),
                ]);
        }

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_banned',
            'metadata' => [
                'banned_user_id' => $user->id,
                'banned_user_email' => $user->email,
                'report_id' => $request->report_id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User permanently banned and files deleted successfully',
            'data' => ['id' => $user->id, 'is_banned' => true],
        ]);
    }

    public function deleteFile(string $id, Request $request): JsonResponse
    {
        $file = File::query()->withTrashed()->findOrFail($id);

        if ($file->storage_path) {
            \Illuminate\Support\Facades\Storage::disk('local')->delete($file->storage_path);
        }

        if ($request->has('report_id')) {
            Report::where('id', $request->report_id)->update([
                'status' => 'reviewed',
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);
        }

        $file->forceDelete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'admin_deleted_file',
            'metadata' => [
                'file_id' => $id,
                'report_id' => $request->report_id,
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File berhasil dihapus permanen oleh admin.',
        ]);
    }
}
