<?php

namespace App\Services;

class TFIDFService
{
    private array $stopWords = [
        // English
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'was', 'are',
        'be', 'as', 'we', 'our', 'you', 'your', 'they', 'their', 'its', 'not',
        'have', 'had', 'has', 'will', 'would', 'could', 'should', 'may', 'can',
        'do', 'did', 'does', 'been', 'being', 'also', 'each', 'than', 'more',
        'when', 'where', 'how', 'what', 'who', 'which', 'all', 'both', 'he',
        'she', 'him', 'his', 'her', 'up', 'out', 'so', 'if', 'then', 'into',
        'about', 'after', 'before', 'through', 'over', 'between', 'such', 'no',
        'my', 'me', 'i', 'we', 'us', 'any', 'some', 'same', 'other', 'these',
        'those', 'just', 'very', 'much', 'many', 'most', 'few', 'get', 'got',
        'make', 'made', 'take', 'come', 'like', 'use', 'used', 'one', 'two',
        'new', 'good', 'first', 'last', 'long', 'great', 'little', 'own',
        // Indonesian
        'yang', 'dan', 'atau', 'di', 'ke', 'dari', 'ini', 'itu', 'apa', 'agar',
        'dengan', 'untuk', 'pada', 'oleh', 'dalam', 'adalah', 'akan', 'ada',
        'tidak', 'juga', 'sudah', 'bisa', 'saya', 'kami', 'kita', 'mereka',
        'jika', 'maka', 'tapi', 'tetapi', 'namun', 'karena', 'sebab', 'bahwa',
        'seperti', 'setelah', 'sebelum', 'ketika', 'semua', 'setiap', 'banyak',
        'lebih', 'sangat', 'masih', 'hanya', 'antara', 'melalui', 'terhadap',
        'tentang', 'sampai', 'sejak', 'dimana', 'bagaimana', 'mengapa', 'siapa',
        'kapan', 'berapa', 'pula', 'lagi', 'harus', 'perlu', 'boleh', 'bukan',
        'belum', 'sedang', 'telah', 'kepada', 'daripada', 'menurut', 'serta',
        'maupun', 'yaitu', 'yakni', 'ialah', 'adapun', 'walau', 'meski',
        'supaya', 'sehingga', 'apabila', 'walaupun', 'meskipun', 'tersebut',
        'anda', 'kamu', 'dia', 'hal', 'cara', 'jenis', 'bagian', 'salah',
    ];

    public function extractTags(string $text, int $topN = 3): array
    {
        $tokens = $this->tokenize($text);
        if (empty($tokens)) {
            return [];
        }

        $tf = $this->computeTF($tokens);
        arsort($tf);

        $topTokens = array_slice($tf, 0, $topN, true);

        $tags = [];
        foreach ($topTokens as $word => $score) {
            $tags[] = [
                'name' => ucfirst($word),
                'score' => (float) number_format($score * 10, 2),
            ];
        }

        return $tags;
    }

    private function tokenize(string $text): array
    {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
        $words = preg_split('/\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY);

        return array_filter($words, function ($word) {
            return strlen($word) > 3 && !in_array($word, $this->stopWords);
        });
    }

    private function computeTF(array $tokens): array
    {
        $count = array_count_values($tokens);
        $total = count($tokens);
        $tf = [];
        foreach ($count as $word => $freq) {
            $tf[$word] = $freq / $total;
        }
        return $tf;
    }

    public function similarity(string $a, string $b): float
    {
        $aLower = strtolower($a);
        $bLower = strtolower($b);

        if ($aLower === $bLower) return 1.0;

        similar_text($aLower, $bLower, $percent);
        $simScore = $percent / 100.0;

        // Per-word Levenshtein: compare query ($b) against each word in filename stem ($a)
        $stem  = strtolower(pathinfo($a, PATHINFO_FILENAME));
        $words = preg_split('/[\s\-_.]+/', $stem, -1, PREG_SPLIT_NO_EMPTY);
        $levScore = 0.0;
        foreach ($words as $word) {
            if (strlen($word) < 4) continue;
            $maxLen = max(strlen($bLower), strlen($word));
            if ($maxLen === 0) continue;
            $lev = levenshtein($bLower, $word);
            $s   = 1.0 - ($lev / $maxLen);
            if ($s > $levScore) $levScore = $s;
        }

        return max($simScore, $levScore);
    }

    public function search(array $files, string $query): array
    {
        $query = strtolower(trim($query));
        $scored = [];

        foreach ($files as $file) {
            $score = 0.0;

            $nameScore = $this->similarity($file['name'], $query);
            $score = max($score, $nameScore);

            if (!empty($file['tags'])) {
                foreach ($file['tags'] as $tag) {
                    $tagScore = $this->similarity($tag['name'] ?? $tag, $query);
                    $score = max($score, $tagScore);

                    if (str_contains($tag['name'] ?? $tag, $query) || str_contains($query, $tag['name'] ?? $tag)) {
                        $score = max($score, 0.8);
                    }
                }
            }

            if (str_contains(strtolower($file['name']), $query)) {
                $score = max($score, 0.85);
            }

            if ($score >= 0.5) {
                $file['_score'] = $score;
                $scored[] = $file;
            }
        }

        usort($scored, fn($a, $b) => $b['_score'] <=> $a['_score']);

        return array_map(function ($f) {
            unset($f['_score']);
            return $f;
        }, $scored);
    }
}
