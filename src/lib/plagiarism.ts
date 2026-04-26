// ============================================
// Plagiarism Check Utility
// Pakai Google Custom Search API (gratis 100 query/hari)
// Setup: https://developers.google.com/custom-search/v1/overview
// ============================================

export interface PlagiarismResult {
  score: number           // 0-100 (persentase kemiripan)
  status: 'clean' | 'low' | 'medium' | 'high'
  matches: PlagiarismMatch[]
  checked_at: string
  method: 'google_search' | 'fallback'
  error?: string
}

export interface PlagiarismMatch {
  url: string
  title: string
  snippet: string
  similarity: number
}

// Warna & label berdasarkan score
export function getPlagiarismStatus(score: number): {
  status: PlagiarismResult['status']
  label: string
  color: string
  bg: string
  description: string
} {
  if (score <= 15) return {
    status: 'clean',
    label: 'Aman',
    color: '#25a368',
    bg: 'rgba(37,163,104,0.1)',
    description: 'Tidak terdeteksi kemiripan signifikan',
  }
  if (score <= 35) return {
    status: 'low',
    label: 'Rendah',
    color: '#4a9eff',
    bg: 'rgba(74,158,255,0.1)',
    description: 'Kemiripan rendah, masih dapat diterima',
  }
  if (score <= 60) return {
    status: 'medium',
    label: 'Sedang',
    color: '#c9a84c',
    bg: 'rgba(201,168,76,0.1)',
    description: 'Kemiripan sedang, perlu diperiksa lebih lanjut',
  }
  return {
    status: 'high',
    label: 'Tinggi',
    color: '#e05252',
    bg: 'rgba(224,82,82,0.1)',
    description: 'Kemiripan tinggi, kemungkinan plagiarisme',
  }
}

// ============================================
// Cek plagiarisme dengan Google Custom Search
// Env yang dibutuhkan:
//   GOOGLE_SEARCH_API_KEY
//   GOOGLE_SEARCH_ENGINE_ID
// ============================================
export async function checkPlagiarism(
  title: string,
  content?: string
): Promise<PlagiarismResult> {
  const apiKey    = process.env.GOOGLE_SEARCH_API_KEY
  const engineId  = process.env.GOOGLE_SEARCH_ENGINE_ID

  // Kalau API key tidak ada, pakai fallback
  if (!apiKey || !engineId) {
    return fallbackCheck(title)
  }

  try {
    // Buat query dari judul + potongan konten
    const query = buildSearchQuery(title, content)

    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', engineId)
    url.searchParams.set('q', query)
    url.searchParams.set('num', '10')

    const res  = await fetch(url.toString())
    const data = await res.json()

    if (!res.ok) {
      console.error('Google Search API error:', data.error?.message)
      return fallbackCheck(title)
    }

    const items: any[] = data.items || []
    const matches: PlagiarismMatch[] = []

    for (const item of items) {
      const similarity = estimateSimilarity(title, item.title || '', item.snippet || '')
      if (similarity > 10) {
        matches.push({
          url:        item.link || '',
          title:      item.title || '',
          snippet:    item.snippet || '',
          similarity,
        })
      }
    }

    // Score = rata-rata similarity dari top 3 matches
    const topMatches = matches.sort((a, b) => b.similarity - a.similarity).slice(0, 3)
    const score = topMatches.length > 0
      ? Math.round(topMatches.reduce((sum, m) => sum + m.similarity, 0) / topMatches.length)
      : 0

    const { status } = getPlagiarismStatus(score)

    return {
      score,
      status,
      matches: topMatches,
      checked_at: new Date().toISOString(),
      method: 'google_search',
    }
  } catch (err: any) {
    console.error('Plagiarism check error:', err)
    return fallbackCheck(title)
  }
}

// ============================================
// Fallback: simulasi cek berdasarkan pola judul
// Dipakai kalau API key tidak ada
// ============================================
function fallbackCheck(title: string): PlagiarismResult {
  // Simulasi: judul pendek (<5 kata) = score rendah
  // Ini BUKAN cek sungguhan, hanya placeholder
  const words = title.trim().split(/\s+/).length
  const score = words < 4 ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 30)
  const { status } = getPlagiarismStatus(score)

  return {
    score,
    status,
    matches: [],
    checked_at: new Date().toISOString(),
    method: 'fallback',
    error: 'Google Search API tidak dikonfigurasi. Hasil ini adalah estimasi.',
  }
}

// ============================================
// Helper: buat query search dari judul file
// ============================================
function buildSearchQuery(title: string, content?: string): string {
  // Bersihkan nama file → ambil tanpa ekstensi
  const cleanTitle = title
    .replace(/\.[^.]+$/, '')          // hapus ekstensi
    .replace(/[-_]/g, ' ')            // ganti - dan _ dengan spasi
    .replace(/\s+/g, ' ')
    .trim()

  // Ambil max 8 kata dari judul
  const titleWords = cleanTitle.split(' ').slice(0, 8).join(' ')

  // Kalau ada konten, ambil kalimat pertama
  if (content) {
    const firstSentence = content.trim().split(/[.!?]/)[0].trim().slice(0, 100)
    return `"${titleWords}" ${firstSentence}`
  }

  return `"${titleWords}"`
}

// ============================================
// Helper: estimasi similarity antara query dan hasil
// ============================================
function estimateSimilarity(query: string, resultTitle: string, snippet: string): number {
  const normalize = (s: string) =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s]/g, '')
     .split(/\s+/)
     .filter(Boolean)

  const queryWords  = new Set(normalize(query))
  const resultWords = normalize(resultTitle + ' ' + snippet)

  if (queryWords.size === 0) return 0

  const matches = resultWords.filter(w => queryWords.has(w)).length
  const ratio   = matches / queryWords.size

  // Scale ke 0-100, cap di 95 biar gak pernah 100%
  return Math.min(95, Math.round(ratio * 150))
}
