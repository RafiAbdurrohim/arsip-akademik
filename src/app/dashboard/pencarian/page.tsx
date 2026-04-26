'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, Filter, X, RefreshCw, FileText,
  Download, Eye, Calendar, ChevronDown
} from 'lucide-react'
import { ArsipFile } from '@/types'
import { FILE_TYPE_CONFIG, formatFileSize } from '@/lib/upload'
import { formatDateTime, getRoleLabel } from '@/lib/utils'
import { EmptyState, Badge } from '@/components/ui'
import FilePreviewModal from '@/components/files/FilePreviewModal'

const FILE_TYPES = ['pdf', 'docx', 'xlsx', 'pptx', 'zip', 'jpg', 'png']
const ROLES = ['mahasiswa', 'dosen', 'admin', 'kaprodi', 'perpustakaan']

export default function PencarianPage() {
  const [results, setResults] = useState<ArsipFile[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  // Filters
  const [q, setQ]                     = useState('')
  const [filterType, setFilterType]   = useState('')
  const [filterRole, setFilterRole]   = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [offset, setOffset] = useState(0)
  const limit = 20

  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(q.trim() && { q: q.trim() }),
        ...(filterType && { file_type: filterType }),
        ...(filterRole && { role: filterRole }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      })
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setResults(data.data || [])
      setTotal(data.total || 0)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [q, filterType, filterRole, dateFrom, dateTo, offset])

  // Debounce saat query berubah
  useEffect(() => {
    if (!q.trim() && !filterType && !filterRole && !dateFrom && !dateTo) return
    const timer = setTimeout(doSearch, 400)
    return () => clearTimeout(timer)
  }, [doSearch])

  const handleDownload = async (id: string, name: string) => {
    const res  = await fetch(`/api/files/${id}`)
    const data = await res.json()
    if (data.signed_url) {
      const a = document.createElement('a')
      a.href = data.signed_url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const clearAll = () => {
    setQ(''); setFilterType(''); setFilterRole('')
    setDateFrom(''); setDateTo(''); setOffset(0)
    setResults([]); setTotal(0); setHasSearched(false)
    inputRef.current?.focus()
  }

  const hasFilters = filterType || filterRole || dateFrom || dateTo
  const hasAny     = q.trim() || hasFilters

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Pencarian Dokumen
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Cari dokumen berdasarkan nama, tipe file, atau pengunggah
        </p>
      </div>

      {/* Search bar utama */}
      <div
        className="rounded-2xl border p-4 mb-4"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={e => { setQ(e.target.value); setOffset(0) }}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="Cari nama dokumen..."
              autoFocus
              className="w-full rounded-xl pl-11 pr-4 py-3 text-sm border focus:outline-none transition-all"
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border-light)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: hasFilters ? 'rgba(37,163,104,0.1)' : 'var(--color-bg-elevated)',
              color: hasFilters ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              border: `1px solid ${hasFilters ? 'var(--color-brand-dim)' : 'var(--color-border)'}`,
            }}
          >
            <Filter size={15} />
            Filter
            {hasFilters && (
              <span
                className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: 'var(--color-brand)', color: 'white' }}
              >
                {[filterType, filterRole, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
            <ChevronDown
              size={14}
              style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {/* Search button */}
          <button
            onClick={doSearch}
            disabled={!hasAny || loading}
            className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: hasAny ? 'var(--color-brand)' : 'var(--color-bg-elevated)',
              color: hasAny ? 'white' : 'var(--color-text-muted)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : 'Cari'}
          </button>

          {/* Clear all */}
          {hasAny && (
            <button
              onClick={clearAll}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(224,82,82,0.08)', color: 'var(--color-accent-red)' }}
              title="Hapus semua filter"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            className="mt-4 pt-4 space-y-4"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {/* File type chips */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Tipe File
              </p>
              <div className="flex flex-wrap gap-2">
                {FILE_TYPES.map(type => {
                  const cfg = FILE_TYPE_CONFIG[type]
                  const active = filterType === type
                  return (
                    <button
                      key={type}
                      onClick={() => { setFilterType(active ? '' : type); setOffset(0) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? cfg.bg : 'var(--color-bg-elevated)',
                        color: active ? cfg.color : 'var(--color-text-muted)',
                        border: `1px solid ${active ? cfg.color + '40' : 'var(--color-border)'}`,
                      }}
                    >
                      {cfg.icon} .{type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Role uploader */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Diupload Oleh (Role)
              </p>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => {
                  const active = filterRole === role
                  return (
                    <button
                      key={role}
                      onClick={() => { setFilterRole(active ? '' : role); setOffset(0) }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? 'rgba(37,163,104,0.1)' : 'var(--color-bg-elevated)',
                        color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
                        border: `1px solid ${active ? 'var(--color-brand-dim)' : 'var(--color-border)'}`,
                      }}
                    >
                      {getRoleLabel(role)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <Calendar size={11} className="inline mr-1" />Dari Tanggal
                </p>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setOffset(0) }}
                  className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <Calendar size={11} className="inline mr-1" />Sampai Tanggal
                </p>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setOffset(0) }}
                  className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result count */}
      {hasSearched && !loading && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {total > 0
            ? `Ditemukan ${total} dokumen${q.trim() ? ` untuk "${q}"` : ''}`
            : `Tidak ada hasil${q.trim() ? ` untuk "${q}"` : ''}`}
        </p>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-20" />
          ))}
        </div>
      ) : !hasSearched ? (
        /* Empty state - belum search */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--color-bg-elevated)', fontSize: '2rem' }}
          >
            🔍
          </div>
          <p className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Cari dokumen apa saja
          </p>
          <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
            Ketik nama file di atas atau gunakan filter untuk mempersempit hasil pencarian
          </p>
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="Tidak ada dokumen ditemukan"
          desc="Coba ubah kata kunci atau filter yang digunakan"
        />
      ) : (
        <>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Dokumen', 'Tipe', 'Ukuran', 'Uploader', 'Tanggal', 'Aksi'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((file, i) => {
                  const cfg = FILE_TYPE_CONFIG[file.file_type] || FILE_TYPE_CONFIG['pdf']
                  return (
                    <tr
                      key={file.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : undefined }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.bg, fontSize: '1rem' }}
                          >
                            {cfg.icon}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate max-w-[200px]"
                              style={{ color: 'var(--color-text-primary)' }}
                            >
                              {/* Highlight query */}
                              {q.trim()
                                ? file.original_name.split(new RegExp(`(${q.trim()})`, 'gi')).map((part, idx) =>
                                    part.toLowerCase() === q.trim().toLowerCase()
                                      ? <mark key={idx} style={{ background: 'rgba(37,163,104,0.25)', color: 'var(--color-brand)', borderRadius: '2px' }}>{part}</mark>
                                      : part
                                  )
                                : file.original_name
                              }
                            </p>
                            {(file as any).category?.name && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                📁 {(file as any).category.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          .{file.file_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {(file as any).uploader?.full_name || '—'}
                          </p>
                          {(file as any).uploader?.role && (
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {getRoleLabel((file as any).uploader.role)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDateTime(file.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewId(file.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: 'var(--color-brand)' }}
                            title="Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownload(file.id, file.original_name)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                            style={{ color: 'var(--color-text-muted)' }}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Menampilkan {offset + 1}–{Math.min(offset + limit, total)} dari {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: offset === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    opacity: offset === 0 ? 0.5 : 1,
                  }}
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: offset + limit >= total ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    opacity: offset + limit >= total ? 0.5 : 1,
                  }}
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview modal */}
      <FilePreviewModal fileId={previewId} onClose={() => setPreviewId(null)} />
    </div>
  )
}
