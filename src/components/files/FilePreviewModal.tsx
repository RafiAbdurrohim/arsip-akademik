'use client'

import { useState, useEffect } from 'react'
import {
  X, Download, ExternalLink, FileText, Calendar,
  User, HardDrive, Tag, Shield, Eye
} from 'lucide-react'
import { ArsipFile } from '@/types'
import { FILE_TYPE_CONFIG } from '@/lib/upload'
import { formatFileSize, formatDateTime, getRoleLabel } from '@/lib/utils'

interface FilePreviewModalProps {
  fileId: string | null
  onClose: () => void
}

export default function FilePreviewModal({ fileId, onClose }: FilePreviewModalProps) {
  const [file, setFile] = useState<ArsipFile | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewTab, setPreviewTab] = useState<'preview' | 'info'>('preview')

  useEffect(() => {
    if (!fileId) { setFile(null); setSignedUrl(null); return }

    setLoading(true)
    fetch(`/api/files/${fileId}`)
      .then(r => r.json())
      .then(data => {
        setFile(data.data)
        setSignedUrl(data.signed_url || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fileId])

  if (!fileId) return null

  const cfg = file ? (FILE_TYPE_CONFIG[file.file_type] || FILE_TYPE_CONFIG['pdf']) : null
  const canPreview = file && ['pdf', 'jpg', 'png'].includes(file.file_type)

  function handleDownload() {
    if (!signedUrl || !file) return
    const link = document.createElement('a')
    link.href = signedUrl
    link.download = file.original_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {cfg && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: cfg.bg }}
              >
                {cfg.icon}
              </div>
            )}
            <div className="min-w-0">
              <p
                className="font-semibold text-sm truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {file?.original_name || 'Memuat...'}
              </p>
              {file && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {formatFileSize(file.file_size)} • {cfg?.label}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tabs */}
            <div
              className="hidden sm:flex items-center rounded-xl p-1 gap-1"
              style={{ background: 'var(--color-bg-elevated)' }}
            >
              {(['preview', 'info'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPreviewTab(tab)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: previewTab === tab ? 'var(--color-bg-card)' : 'transparent',
                    color: previewTab === tab ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  }}
                >
                  {tab === 'preview' ? <><Eye size={12} className="inline mr-1" />Preview</> : <><FileText size={12} className="inline mr-1" />Info</>}
                </button>
              ))}
            </div>

            {/* Download */}
            {signedUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'var(--color-brand)', color: 'white' }}
              >
                <Download size={13} /> Unduh
              </button>
            )}

            {/* Open in new tab */}
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
                title="Buka di tab baru"
              >
                <ExternalLink size={14} />
              </a>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto skeleton"
                  style={{ background: 'var(--color-bg-elevated)' }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Memuat file...
                </p>
              </div>
            </div>
          ) : previewTab === 'preview' ? (
            /* Preview Area */
            <div className="flex-1 overflow-auto bg-black/20">
              {!file ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: 'var(--color-text-muted)' }}>File tidak ditemukan</p>
                </div>
              ) : canPreview && signedUrl ? (
                file.file_type === 'pdf' ? (
                  <iframe
                    src={signedUrl}
                    className="w-full h-full min-h-[500px]"
                    title={file.original_name}
                  />
                ) : (
                  /* Image preview */
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
                /* Non-previewable: show download prompt */
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center space-y-4 p-8">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto"
                      style={{ background: cfg?.bg || 'var(--color-bg-elevated)' }}
                    >
                      {cfg?.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        Preview tidak tersedia
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        File {cfg?.label} tidak bisa ditampilkan langsung.<br />
                        Unduh file untuk membukanya.
                      </p>
                    </div>
                    {signedUrl && (
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all"
                        style={{ background: 'var(--color-brand)', color: 'white' }}
                      >
                        <Download size={16} /> Unduh File
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Info tab */
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {file && (
                <>
                  {/* File info card */}
                  <div
                    className="rounded-2xl border p-5 space-y-4"
                    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                      Informasi File
                    </p>
                    {[
                      { icon: <FileText size={15} />, label: 'Nama File', value: file.original_name },
                      { icon: <Tag size={15} />, label: 'Tipe File', value: (cfg?.label || file.file_type).toUpperCase() },
                      { icon: <HardDrive size={15} />, label: 'Ukuran', value: formatFileSize(file.file_size) },
                      { icon: <Calendar size={15} />, label: 'Diupload', value: formatDateTime(file.created_at) },
                      { icon: <User size={15} />, label: 'Diupload Oleh', value: (file as any).uploader?.full_name || '—' },
                      { icon: <User size={15} />, label: 'Role Uploader', value: getRoleLabel((file as any).uploader?.role || '') },
                      { icon: <Tag size={15} />, label: 'Kategori', value: (file as any).category?.name || 'Tidak ada kategori' },
                      { icon: <Shield size={15} />, label: 'Enkripsi', value: file.is_encrypted ? 'Terenkripsi AES-256' : 'Tidak terenkripsi' },
                    ].map(item => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                          <p className="text-sm font-medium break-all" style={{ color: 'var(--color-text-primary)' }}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
