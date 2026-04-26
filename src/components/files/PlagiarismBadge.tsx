'use client'

import { useState } from 'react'
import { ShieldCheck, AlertTriangle, RefreshCw, ExternalLink, ChevronDown } from 'lucide-react'
import { getPlagiarismStatus, PlagiarismResult } from '@/lib/plagiarism'

interface PlagiarismBadgeProps {
  fileId: string
  score: number | null
  compact?: boolean           // tampilkan versi mini (untuk tabel/card)
  canRecheck?: boolean        // tampilkan tombol re-check
}

export default function PlagiarismBadge({
  fileId,
  score,
  compact = false,
  canRecheck = false,
}: PlagiarismBadgeProps) {
  const [checking, setChecking]   = useState(false)
  const [result, setResult]       = useState<PlagiarismResult | null>(null)
  const [currentScore, setCurrentScore] = useState<number | null>(score)
  const [expanded, setExpanded]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function runCheck() {
    setChecking(true)
    setError(null)
    try {
      const res  = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal cek plagiarisme')
      setResult(data.data)
      setCurrentScore(data.data.score)
      setExpanded(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setChecking(false)
    }
  }

  // Belum dicek sama sekali
  if (currentScore === null && !result) {
    if (compact) {
      return canRecheck ? (
        <button
          onClick={runCheck}
          disabled={checking}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
        >
          {checking
            ? <RefreshCw size={10} className="animate-spin" />
            : <ShieldCheck size={10} />}
          {checking ? 'Mengecek...' : 'Cek Plagiarisme'}
        </button>
      ) : (
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum dicek</span>
      )
    }

    return (
      <div
        className="rounded-2xl border p-4 flex items-start gap-3"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <ShieldCheck size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Plagiarisme belum dicek
          </p>
          {canRecheck && (
            <button
              onClick={runCheck}
              disabled={checking}
              className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
              style={{ background: 'rgba(37,163,104,0.1)', color: 'var(--color-brand)' }}
            >
              {checking ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              {checking ? 'Mengecek...' : 'Jalankan Cek Plagiarisme'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const info = getPlagiarismStatus(currentScore ?? 0)

  // Mode compact (badge kecil untuk tabel/card)
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: info.bg, color: info.color }}
        >
          {currentScore}% {info.label}
        </span>
        {canRecheck && (
          <button
            onClick={runCheck}
            disabled={checking}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            title="Cek ulang"
          >
            <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    )
  }

  // Mode full (panel detail)
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--color-bg-card)', borderColor: info.color + '30' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{ background: info.bg }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: info.color + '20' }}
        >
          {info.status === 'clean' || info.status === 'low'
            ? <ShieldCheck size={18} style={{ color: info.color }} />
            : <AlertTriangle size={18} style={{ color: info.color }} />
          }
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm" style={{ color: info.color }}>
              {info.label} — {currentScore}%
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: info.color + '20', color: info.color }}
            >
              Kemiripan
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {info.description}
          </p>
        </div>

        {/* Score ring */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreRing score={currentScore ?? 0} color={info.color} />
          <ChevronDown
            size={15}
            style={{
              color: 'var(--color-text-muted)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full" style={{ background: 'var(--color-bg-elevated)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${currentScore ?? 0}%`,
            background: `linear-gradient(90deg, ${info.color}80, ${info.color})`,
          }}
        />
      </div>

      {/* Detail panel */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Method info */}
          {result?.method === 'fallback' && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c' }}
            >
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
              {result.error || 'Google Search API tidak dikonfigurasi. Aktifkan di .env.local untuk hasil lebih akurat.'}
            </div>
          )}

          {/* Matches */}
          {result?.matches && result.matches.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Sumber Kemiripan ({result.matches.length})
              </p>
              <div className="space-y-2">
                {result.matches.map((match, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 space-y-1"
                    style={{ background: 'var(--color-bg-elevated)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>
                        {match.title}
                      </p>
                      <span
                        className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: info.bg, color: info.color }}
                      >
                        {match.similarity}%
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                      {match.snippet}
                    </p>
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs transition-all hover:underline"
                      style={{ color: 'var(--color-brand)' }}
                    >
                      <ExternalLink size={10} /> Lihat sumber
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-check button */}
          {canRecheck && (
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {result?.checked_at
                  ? `Terakhir dicek: ${new Date(result.checked_at).toLocaleString('id-ID')}`
                  : 'Klik untuk cek ulang'
                }
              </p>
              <button
                onClick={runCheck}
                disabled={checking}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all"
                style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
              >
                <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
                {checking ? 'Mengecek...' : 'Cek Ulang'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="px-4 pb-3">
          <p className="text-xs" style={{ color: 'var(--color-accent-red)' }}>{error}</p>
        </div>
      )}
    </div>
  )
}

// ============================================
// Score Ring SVG
// ============================================
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size   = 40
  const radius = 16
  const stroke = 3
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--color-bg-elevated)" strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Text */}
      <text
        x={size / 2} y={size / 2 + 4}
        textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: '9px', fontWeight: 700, fill: color }}
      >
        {score}%
      </text>
    </svg>
  )
}
