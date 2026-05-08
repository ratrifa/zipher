<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Services\TFIDFService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SearchController extends Controller
{
    public function __construct(
        private TFIDFService $tfidf
    ) {}

    public function search(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'q'         => 'required|string|min:1|max:255',
                'mime_type' => 'nullable|string|max:100',
                'folder_id' => 'nullable|uuid|exists:folders,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                ], 422);
            }

            $rawQuery = trim($request->q);
            $queryLower = strtolower($rawQuery);
            $userId = auth()->id();
            $folderId = $request->query('folder_id');

            $mimeCategories = [
                'image' => [
                    'mimes' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'],
                    'exts'  => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tif', 'tiff']
                ],
                'document' => [
                    'mimes' => [
                        'application/pdf', 'text/plain', 'text/csv', 'text/rtf', 'text/markdown',
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/json'
                    ],
                    'exts' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'md', 'json']
                ],
                'video' => [
                    'mimes' => ['video/mp4', 'video/mpeg', 'video/ogg', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
                    'exts'  => ['mp4', 'mpeg', 'mpg', 'ogv', 'mov', 'webm', 'avi']
                ],
                'audio' => [
                    'mimes' => ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/midi', 'audio/x-midi', 'audio/webm', 'audio/aac'],
                    'exts'  => ['mp3', 'wav', 'ogg', 'mid', 'midi', 'aac', 'm4a']
                ],
            ];

            $intents = [
                'image'    => '/\b(gambar|foto|image|images|photo|photos|img|png|jpg|jpeg|gif|webp|svg|bmp|ico|tiff?)\b/i',
                'video'    => '/\b(video|videos|film|movie|movies|mp4|mov|avi|mkv|wmv|flv|webm|m4v)\b/i',
                'audio'    => '/\b(audio|music|musik|suara|lagu|song|mp3|wav|aac|flac|ogg|m4a|midi?)\b/i',
                'document' => '/\b(dokumen|document|documents|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|teks|text|md|markdown|csv|json|xml|html?|zip|rar|7z|py|js|ts|java|cpp|rb|php)\b/i',
                'folder'   => '/\b(folder|direktori|directory|dir)\b/i',
            ];

            // Quote search: "phrase" → word-coverage scoring against file keywords
            if (preg_match('/^"(.+)"$/', $rawQuery, $m)) {
                $phraseWords = array_values(array_filter(
                    preg_split('/\s+/', strtolower(trim($m[1]))),
                    fn($w) => strlen($w) >= 3
                ));

                if (empty($phraseWords)) {
                    return response()->json(['success' => true, 'data' => []]);
                }

                $files = File::where('user_id', $userId)->with(['tags', 'keywords'])->get();
                $results = [];
                foreach ($files as $file) {
                    $kwSet = $file->keywords->pluck('keyword')
                        ->map(fn($k) => strtolower($k))->toArray();
                    $matches = array_filter($phraseWords, fn($w) =>
                        in_array($w, $kwSet) ||
                        count(array_filter($kwSet, fn($k) => str_contains($k, $w))) > 0
                    );
                    $coverage = count($matches) / count($phraseWords);
                    if ($coverage >= 0.5) {
                        $results[] = array_merge($file->toArray(), [
                            'type'       => 'file',
                            '_coverage'  => $coverage,
                            'tags'       => $file->tags->map(fn($t) => ['name' => $t->name, 'score' => $t->score])->toArray(),
                        ]);
                    }
                }
                usort($results, fn($a, $b) => $b['_coverage'] <=> $a['_coverage']);
                $results = array_map(fn($r) => array_diff_key($r, ['_coverage' => '']), $results);
                return response()->json(['success' => true, 'data' => array_values($results)]);
            }

            // Short-query guard: < 3 chars → exact name match only, no TF-IDF
            if (strlen($rawQuery) < 3) {
                $files = File::where('user_id', $userId)
                    ->where('name', 'LIKE', "%{$rawQuery}%")
                    ->with('tags')
                    ->get()
                    ->map(fn($f) => array_merge($f->toArray(), ['type' => 'file', 'tags' => $f->tags->pluck('name')->toArray()]));
                return response()->json(['success' => true, 'data' => $files->values()]);
            }

            $categoryFilter = null;
            $searchTerm = $rawQuery;

            foreach ($intents as $category => $pattern) {
                if (preg_match($pattern, $rawQuery)) {
                    $categoryFilter = $category;
                    $cleanedQuery = trim(preg_replace($pattern, '', $rawQuery));
                    $searchTerm = $cleanedQuery ?: null; 
                    break;
                }
            }

            $queryExt   = ltrim($queryLower, '.');
            $allExts    = array_merge(...array_column($mimeCategories, 'exts'));
            $isExtSearch = !$categoryFilter && in_array($queryExt, $allExts);

            $filesQuery = File::where('user_id', $userId)->with(['tags', 'keywords']);
            if ($request->filled('folder_id')) {
                $filesQuery->where('folder_id', $folderId);
            }

            // Push category filter to DB — avoids loading all files for typed searches
            if ($categoryFilter && $categoryFilter !== 'folder') {
                $mimes = $mimeCategories[$categoryFilter]['mimes'];
                $exts  = $mimeCategories[$categoryFilter]['exts'];
                $filesQuery->where(function ($q) use ($mimes, $exts) {
                    $q->whereIn('mime_type', $mimes);
                    foreach ($exts as $ext) {
                        $q->orWhere('name', 'LIKE', "%.$ext");
                    }
                });
            }

            // Push extension filter to DB
            if ($isExtSearch) {
                $filesQuery->where('name', 'LIKE', "%.$queryExt");
            }

            $files = $categoryFilter === 'folder' ? collect() : $filesQuery->get();

            $filesData = $files->map(function ($f) use ($mimeCategories) {
                $fileArray = $f->toArray();
                $fileArray['tags'] = $f->tags->pluck('name')->toArray();
                $fileArray['keywords'] = $f->keywords->pluck('keyword')->toArray();
                $fileArray['extension'] = strtolower(pathinfo($f->name, PATHINFO_EXTENSION));
                $mime = strtolower($f->mime_type);
                $cat  = 'other';
                foreach ($mimeCategories as $category => $data) {
                    if (in_array($mime, $data['mimes']) || in_array($fileArray['extension'], $data['exts'])) {
                        $cat = $category;
                        break;
                    }
                }
                $fileArray['file_category'] = $cat;
                return $fileArray;
            });

            $fileResults = [];
            $folderResults = [];

            if ($categoryFilter === 'folder') {
                $foldersQuery = Folder::where('user_id', $userId);
                if ($request->filled('folder_id')) {
                    $foldersQuery->where('parent_id', $folderId);
                }
                $allFolders = $foldersQuery->get()->toArray();

                if ($searchTerm) {
                    $folderResults = $this->tfidf->search(array_map(fn($f) => array_merge($f, ['tags' => []]), $allFolders), $searchTerm);
                } else {
                    $folderResults = $allFolders;
                }
                $fileResults = [];
            } elseif ($isExtSearch) {
                // Already filtered by extension in DB
                $fileResults  = $filesData->values()->toArray();
                $folderResults = [];
            } elseif ($categoryFilter && !$searchTerm) {
                // Already filtered by category in DB
                $fileResults  = $filesData->values()->toArray();
                $folderResults = [];
            } elseif ($categoryFilter && $searchTerm) {
                // Category-filtered subset → TF-IDF
                $fileResults  = $this->tfidf->search($filesData->toArray(), $searchTerm);
                $folderResults = [];
            } else {
                // General search — TF-IDF on all user files
                $exactMatches = $filesData->filter(function ($f) use ($queryLower) {
                    if (strtolower($f['mime_type']) === $queryLower) return true;
                    foreach ($f['tags'] as $tag) {
                        $tagLower = strtolower($tag);
                        if ($tagLower === $queryLower) return true;
                        if (strlen($queryLower) >= 4 && str_contains($tagLower, $queryLower)) return true;
                    }
                    foreach (($f['keywords'] ?? []) as $kw) {
                        if (strlen($queryLower) >= 3 && str_contains(strtolower($kw), $queryLower)) return true;
                    }
                    return strtolower(pathinfo($f['name'], PATHINFO_FILENAME)) === $queryLower;
                });

                if ($exactMatches->isNotEmpty()) {
                    $fileResults = $exactMatches->values()->toArray();
                } else {
                    $fileResults = $this->tfidf->search($filesData->toArray(), $rawQuery);
                }

                $foldersQuery = Folder::where('user_id', $userId);
                if ($request->filled('folder_id')) {
                    $foldersQuery->where('parent_id', $folderId);
                }
                $allFolders   = $foldersQuery->get()->toArray();
                $exactFolders = array_filter($allFolders, fn($f) => strtolower($f['name']) === $queryLower);

                if (!empty($exactFolders)) {
                    $folderResults = $exactFolders;
                } elseif ($rawQuery) {
                    $folderResults = $this->tfidf->search(array_map(fn($f) => array_merge($f, ['tags' => []]), $allFolders), $rawQuery);
                }
            }

            $finalResults = collect($folderResults)->map(fn($f) => array_merge($f, ['type' => 'folder']))
                ->concat(collect($fileResults)->map(fn($f) => array_merge($f, ['type' => 'file'])))
                ->values();

            return response()->json([
                'success' => true,
                'data'    => $finalResults,
            ]);
        } catch (\Exception $e) {
            \Log::error('Search error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'query' => $request->q
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server saat pencarian: ' . $e->getMessage(),
            ], 500);
        }
    }
}
