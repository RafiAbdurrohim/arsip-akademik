'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Download, ExternalLink, FileText,
  Calendar, User, HardDrive, Tag, Shield,
  Eye, Info, Clock
} from 'lucide-react'
import { ArsipFile } from '@/types'
import { FILE_TYPE_CONFIG, formatFileSize } from '@/lib/upload'
import { formatDateTime, getRoleLabel } from '@/lib/utils'
import Link from 'next/link'

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const fileId       = searchParams.get('id')

  const [file, setFile]           = useState<ArsipFile | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'preview' | 'info'>('preview')

  useEffect(() => {
    if (!fileId) { setLoading(false); return }
    fetch(`/api/files/${fileId}`)
      .then(r => r.json())
      .then(data => {
        setFile(data.data)
        setSignedUrl(data.signed_url || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fileId])

  const cfg = file ? (FILE_TYPE_CONFIG[file.file_type] || FILE_TYPE_CONFIG['pdf']) : null
  const canPreview = file && ['pdf', 'jpg', 'png'].includes(file.file_type)

  function handleDownload() {
    if (!signedUrl || !file) return
    const a = document.createElement('a')
    a.href = signedUrl
    a.download = file.original_name
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  if (!fileId) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4"
            style={{ background: 'var(--color-bg-elevated)' }}>
            📄
          </div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Tidak ada file yang dipilih
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Pilih file dari halaman Arsip atau Pencarian untuk melihat preview-nya di sini.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/arsip"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--color-brand)', color: 'white' }}
            >
              Ke Halaman Arsip
            </Link>
            <Link
              href="/dashboard/pencarian"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              Cari Dokumen
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)' }}
      >
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={15} />
        </button>

        {/* File info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {cfg && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: cfg.bg }}
            >
              {cfg.icon}
            </div>
          )}
          <div className="min-w-0">
            {loading ? (
              <div className="skeleton h-4 w-48 rounded" />
            ) : (
              <>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {file?.original_name || 'File tidak ditemukan'}
                </p>
                {file && (
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {formatFileSize(file.file_size)} • {cfg?.label}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="hidden sm:flex items-center rounded-xl p-1 gap-1"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          {(['preview', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeTab === tab ? 'var(--color-bg-card)' : 'transparent',
                color: activeTab === tab ? 'var(--color-brand)' : 'var(--color-text-muted)',
              }}
            >
              {tab === 'preview' ? <Eye size={12} /> : <Info size={12} />}
              {tab === 'preview' ? 'Preview' : 'Info'}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {signedUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--color-brand)', color: 'white' }}
            >
              <Download size={13} /> Unduh
            </button>
          )}
          {signedUrl && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
              title="Buka di tab baru"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl skeleton mx-auto" />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat dokumen...</p>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          <div className="flex-1 overflow-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {!file ? (
              <div className="flex items-center justify-center h-full">
                <p style={{ color: 'var(--color-text-muted)' }}>File tidak ditemukan</p>
              </div>
            ) : canPreview && signedUrl ? (
              file.file_type === 'pdf' ? (
                <iframe
                  src={signedUrl}
                  className="w-full"
                  style={{ height: '100%', minHeight: '600px', border: 'none' }}
                  title={file.original_name}
                />
              ) : (
                <div className="flex items-center justify-center p-8 h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedUrl}
                    alt={file.original_name}
                    className="max-w-full max-h-full rounded-xl object-contain"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                  />
                </div>
              )
            ) : (
              /* Cannot preview */
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-4 p-8">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mx-auto"
                    style={{ background: cfg?.bg || 'var(--color-bg-elevated)' }}
                  >
                    {cfg?.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      Preview tidak tersedia
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      File {cfg?.label} tidak bisa ditampilkan langsung di browser.<br />
                      Unduh untuk membukanya dengan aplikasi yang sesuai.
                    </p>
                    {signedUrl && (
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
                        style={{ background: 'var(--color-brand)', color: 'white' }}
                      >
                        <Download size={16} /> Unduh {cfg?.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Info tab */
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-lg mx-auto space-y-4">
              {file && (
                <>
                  {/* File thumbnail */}
                  <div
                    className="p-6 rounded-2xl border flex items-center gap-4"
                    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ background: cfg?.bg }}
                    >
                      {cfg?.icon}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {file.original_name}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {formatFileSize(file.file_size)} • {cfg?.label}
                      </p>
                    </div>
                  </div>

                  {/* Detail info */}
                  <div
                    className="rounded-2xl border divide-y"
                    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', '--tw-divide-opacity': 1 } as any}
                  >
                    {[
                      { icon: <FileText size={15} />,  label: 'Nama File',     value: file.original_name },
                      { icon: <Tag size={15} />,        label: 'Format',        value: cfg?.label + ' (.' + file.file_type + ')' },
                      { icon: <HardDrive size={15} />,  label: 'Ukuran File',   value: formatFileSize(file.file_size) },
                      { icon: <Calendar size={15} />,   label: 'Tanggal Upload', value: formatDateTime(file.created_at) },
                      { icon: <Clock size={15} />,      label: 'Terakhir Update', value: formatDateTime(file.updated_at) },
                      { icon: <User size={15} />,       label: 'Diupload Oleh', value: (file as any).uploader?.full_name || '—' },
                      { icon: <User size={15} />,       label: 'Role Pengunggah', value: getRoleLabel((file as any).uploader?.role || '') },
                      { icon: <Tag size={15} />,        label: 'Kategori',      value: (file as any).category?.name || '—' },
                      { icon: <Shield size={15} />,     label: 'Status Enkripsi', value: file.is_encrypted ? '🔒 Terenkripsi AES-256' : '🔓 Tidak terenkripsi' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3 px-5 py-3.5">
                        <div className="w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-brand)' }}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                          <p className="text-sm font-medium mt-0.5 break-all" style={{ color: 'var(--color-text-primary)' }}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {signedUrl && (
                      <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                        style={{ background: 'var(--color-brand)', color: 'white' }}
                      >
                        <Download size={16} /> Unduh File
                      </button>
                    )}
                    {signedUrl && (
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border"
                        style={{
                          background: 'var(--color-bg-elevated)',
                          color: 'var(--color-text-secondary)',
                          borderColor: 'var(--color-border)',
                        }}
                      >
                        <ExternalLink size={15} /> Buka Tab Baru
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
