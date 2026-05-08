<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileActivity;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;

class RecentController extends Controller
{
    public function index(): JsonResponse
    {
        $activities = FileActivity::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $folderCache = [];

        $data = $activities->map(function ($activity) use (&$folderCache) {
            $row = $activity->toArray();
            $row['location'] = 'My Files';

            if ($activity->file_id && !$activity->is_folder) {
                $file = File::withTrashed()->find($activity->file_id);
                if ($file && $file->folder_id) {
                    if (!isset($folderCache[$file->folder_id])) {
                        $folderCache[$file->folder_id] = Folder::find($file->folder_id);
                    }
                    $folder = $folderCache[$file->folder_id];
                    if ($folder) {
                        $row['location'] = $folder->name;
                    }
                }
            }

            return $row;
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}
