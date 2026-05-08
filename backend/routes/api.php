<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContentsController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RecentController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ShareController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsureNotBanned;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('verify-reset-key', [AuthController::class, 'verifyResetKey']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware(['auth:sanctum', EnsureNotBanned::class])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('users/search', [AuthController::class, 'searchUsers']);
        Route::get('users/{id}/public-key', [AuthController::class, 'getPublicKey']);
        Route::post('reports', [ReportController::class, 'store']);

        // Contents (file + folder)
        Route::get('contents', [ContentsController::class, 'index']);
        Route::post('contents/move', [ContentsController::class, 'move']);

        // Smart search
        Route::get('search', [SearchController::class, 'search']);

        // Recent 
        Route::get('recent', [RecentController::class, 'index']);

        // Files
        Route::get('storage/breakdown', [FileController::class, 'storageBreakdown']);
        Route::get('files/trash', [FileController::class, 'trash']);
        Route::get('files/starred', [FileController::class, 'starred']);
        Route::post('files/{id}/star', [FileController::class, 'toggleStar']);
        Route::get('files', [FileController::class, 'index']);
        Route::post('files/upload', [FileController::class, 'upload']);
        Route::get('files/{id}/download', [FileController::class, 'download']);
        Route::get('files/{id}/key', [FileController::class, 'getKey']);
        Route::patch('files/{id}', [FileController::class, 'update']);
        Route::delete('files/{id}', [FileController::class, 'destroy']);
        Route::post('files/{id}/restore', [FileController::class, 'restore']);
        Route::delete('files/{id}/force', [FileController::class, 'forceDelete']);

        // Folders
        Route::post('folders/{id}/star', [FolderController::class, 'toggleStar']);
        Route::get('files/{id}/tags', [FileController::class, 'tags']);
        Route::put('files/{id}/tags', [FileController::class, 'replaceTags']);
        Route::delete('files/{id}/tags/{tagId}', [FileController::class, 'destroyTag']);
        Route::get('folders/trash', [FolderController::class, 'trash']);
        Route::get('folders', [FolderController::class, 'index']);
        Route::post('folders', [FolderController::class, 'store']);
        Route::patch('folders/{id}', [FolderController::class, 'update']);
        Route::delete('folders/{id}', [FolderController::class, 'destroy']);
        Route::post('folders/{id}/restore', [FolderController::class, 'restore']);
        Route::delete('folders/{id}/force', [FolderController::class, 'forceDelete']);

        // Profile
        Route::patch('profile', [ProfileController::class, 'update']);
        Route::post('profile/password', [ProfileController::class, 'updatePassword']);
        Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);

        // Sharing
        Route::post('share', [ShareController::class, 'share']);
        Route::get('shared/with-me', [ShareController::class, 'sharedWithMe']);
        Route::get('shared/by-me', [ShareController::class, 'sharedByMe']);
        Route::delete('share/{id}', [ShareController::class, 'revoke']);
        Route::delete('shared/received/{id}', [ShareController::class, 'leave']);

        // Admin routes
        Route::middleware(AdminMiddleware::class)->group(function () {
            Route::get('admin/dashboard', [AdminController::class, 'dashboard']);
            Route::get('admin/reports', [AdminController::class, 'recentReports']);
            Route::get('admin/reports/{id}', [AdminController::class, 'showReport']);
            Route::post('admin/reports/{id}/review', [AdminController::class, 'reviewReport']);
            Route::get('admin/users', [AdminController::class, 'users']);
            Route::post('admin/users/{id}/ban', [AdminController::class, 'banUser']);
            Route::delete('admin/files/{id}', [AdminController::class, 'deleteFile']);
            Route::get('admin/activity', [AdminController::class, 'activity']);
        });
    });
});
