<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\ShareController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('users/search', [AuthController::class, 'searchUsers']);
        Route::get('users/{id}/public-key', [AuthController::class, 'getPublicKey']);

        // Files
        Route::get('files/trash', [FileController::class, 'trash']);
        Route::get('files/starred', [FileController::class, 'starred']);
        Route::post('files/{id}/star', [FileController::class, 'toggleStar']);
        Route::get('files', [FileController::class, 'index']);
        Route::post('files/upload', [FileController::class, 'upload']);
        Route::get('files/{id}/download', [FileController::class, 'download']);
        Route::patch('files/{id}', [FileController::class, 'update']);
        Route::delete('files/{id}', [FileController::class, 'destroy']);
        Route::post('files/{id}/restore', [FileController::class, 'restore']);
        Route::delete('files/{id}/force', [FileController::class, 'forceDelete']);

        // Folders
        Route::get('folders/trash', [FolderController::class, 'trash']);
        Route::get('folders', [FolderController::class, 'index']);
        Route::post('folders', [FolderController::class, 'store']);
        Route::patch('folders/{id}', [FolderController::class, 'update']);
        Route::delete('folders/{id}', [FolderController::class, 'destroy']);
        Route::post('folders/{id}/restore', [FolderController::class, 'restore']);
        Route::delete('folders/{id}/force', [FolderController::class, 'forceDelete']);

        // Sharing
        Route::post('share', [ShareController::class, 'share']);
        Route::get('shared/with-me', [ShareController::class, 'sharedWithMe']);
        Route::get('shared/by-me', [ShareController::class, 'sharedByMe']);
        Route::delete('share/{id}', [ShareController::class, 'revoke']);
    });
});
