const STOP_WORDS = new Set([
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
  'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early',
  'young', 'important', 'public', 'private', 'real', 'best', 'free',
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
  'maupun', 'yaitu', 'yakni', 'ialah', 'adapun', 'namun', 'walau',
  'meski', 'supaya', 'sehingga', 'apabila', 'walaupun', 'meskipun',
  'tersebut', 'mereka', 'anda', 'kamu', 'dia', 'mereka', 'siapapun',
  'hal', 'cara', 'jenis', 'bagian', 'salah', 'satu', 'dua', 'tiga',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
}

function computeTF(tokens: string[]): Map<string, number> {
  const count = new Map<string, number>()
  for (const t of tokens) count.set(t, (count.get(t) ?? 0) + 1)
  const total = tokens.length
  const tf = new Map<string, number>()
  for (const [word, freq] of count) tf.set(word, freq / total)
  return tf
}

export function extractKeywords(text: string, topN = 30): string[] {
  const tokens = tokenize(text)
  if (tokens.length === 0) return []

  const tf = computeTF(tokens)
  const topWords = [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w)

  const bigramCounts = new Map<string, number>()
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`
    bigramCounts.set(bg, (bigramCounts.get(bg) ?? 0) + 1)
  }
  const topBigrams = [...bigramCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([bg]) => bg)

  return [...new Set([...topWords, ...topBigrams])].slice(0, topN)
}

export function extractTags(text: string): Array<{ name: string; score: number }> {
  const tokens = tokenize(text)
  if (tokens.length === 0) return []
  const tf = computeTF(tokens)
  return [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, score]) => ({
      name: word.charAt(0).toUpperCase() + word.slice(1),
      score: parseFloat((score * 10).toFixed(2)),
    }))
}
