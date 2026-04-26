'use client'

import { useState } from 'react'
import { Eye, Download, Trash2, MoreVertical, Lock } from 'lucide-react'
import { ArsipFile } from '@/types'
import { FILE_TYPE_CONFIG, formatFileSize } from '@/lib/upload'
import { formatDate, getRoleLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface FileCardProps {
  file: ArsipFile
  currentUserId?: string
  currentUserRole?: string
  onDelete?: (id: string) => void
  onDownload?: (id: string) => void
  onPreview?: (id: string) => void
}

export default function FileCard({
  file,
  currentUserId,
  currentUserRole,
  onDelete,
  onDownload,
  onPreview,
}: FileCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const cfg = FILE_TYPE_CONFIG[file.file_type] || FILE_TYPE_CONFIG['pdf']

  const canDelete =
    file.uploaded_by === currentUserId ||
    currentUserRole === 'admin' ||
    currentUserRole === 'perpustakaan'

  function handlePreview() {
    if (onPreview) {
      onPreview(file.id)
    } else {
      router.push(`/dashboard/preview?id=${file.id}`)
    }
  }

  return (
    <div
      className="relative group rounded-2xl border overflow-hidden transition-all hover:border-opacity-80 hover:-translate-y-0.5"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
    >
      {/* Top color strip */}
      <div className="h-1.5 w-full" style={{ background: cfg.color }} />

      <div className="p-4">
        {/* Icon & type */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: cfg.bg }}
          >
            {cfg.icon}
          </div>
          <div className="flex items-center gap-1.5">
            {file.is_encrypted && (
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(37,163,104,0.1)', color: 'var(--color-brand)' }}
                title="Terenkripsi"
              >
                <Lock size={11} />
              </div>
            )}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              .{file.file_type}
            </span>
          </div>
        </div>

        {/* File name */}
        <p
          className="font-semibold text-sm mb-1 line-clamp-2 leading-snug"
          style={{ color: 'var(--color-text-primary)' }}
          title={file.original_name}
        >
          {file.original_name}
        </p>

        {/* Meta */}
        <div className="space-y-1 mb-4">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
          </p>
          {(file as any).uploader && (
            <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
              oleh {(file as any).uploader.full_name}
              <span className="ml-1 opacity-60">({getRoleLabel((file as any).uploader.role)})</span>
            </p>
          )}
          {(file as any).category && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              📁 {(file as any).category.name}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1.5 pt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {/* Preview */}
          <button
            onClick={handlePreview}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: 'rgba(37,163,104,0.08)',
              color: 'var(--color-brand)',
              border: '1px solid var(--color-brand-dim)',
            }}
          >
            <Eye size={13} /> Preview
          </button>

          {/* Download */}
          {onDownload && (
            <button
              onClick={() => onDownload(file.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
              title="Unduh"
            >
              <Download size={14} />
            </button>
          )}

          {/* Delete (menu) */}
          {canDelete && onDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
              >
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div
                    className="absolute right-0 bottom-10 z-20 rounded-xl border overflow-hidden w-36"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <button
                      onClick={() => { onDelete(file.id); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all hover:bg-red-500/10"
                      style={{ color: 'var(--color-accent-red)' }}
                    >
                      <Trash2 size={12} /> Hapus File
                    </button>
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
