'use client'

import { useCallback, useState } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { validateFile, UPLOAD_CONFIG, FILE_TYPE_CONFIG, formatFileSize } from '@/lib/upload'

interface DropZoneProps {
  onFileSelect: (file: File) => void
  selectedFile?: File | null
  onClear?: () => void
  disabled?: boolean
}

export default function DropZone({ onFileSelect, selectedFile, onClear, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'File tidak valid')
      return
    }
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile, disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = '' // reset agar bisa pilih file sama lagi
  }, [handleFile])

  // Kalau sudah ada file yang dipilih
  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || ''
    const config = FILE_TYPE_CONFIG[ext] || FILE_TYPE_CONFIG['pdf']

    return (
      <div
        className="relative rounded-2xl border p-5 flex items-center gap-4"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-brand-dim)',
        }}
      >
        {/* File type badge */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: config.bg }}
        >
          {config.icon}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {selectedFile.name}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: config.bg, color: config.color }}
            >
              {config.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
        </div>

        {/* Clear button */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        )}

        {/* Success indicator */}
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: 'var(--color-brand)' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label
        className={`
          relative block rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-200
          ${isDragging ? 'scale-[1.01]' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-opacity-80'}
        `}
        style={{
          background: isDragging
            ? 'rgba(37, 163, 104, 0.05)'
            : 'var(--color-bg-elevated)',
          borderColor: isDragging
            ? 'var(--color-brand)'
            : error
              ? 'var(--color-accent-red)'
              : 'var(--color-border-light)',
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          className="sr-only"
          accept={UPLOAD_CONFIG.allowedMimeTypes.join(',')}
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          {/* Upload icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
            style={{
              background: isDragging ? 'rgba(37, 163, 104, 0.15)' : 'var(--color-bg-card)',
              color: isDragging ? 'var(--color-brand)' : 'var(--color-text-muted)',
            }}
          >
            <Upload size={24} />
          </div>

          {/* Text */}
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {isDragging ? 'Lepas file di sini...' : 'Drag & drop file, atau klik untuk pilih'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Maksimal {UPLOAD_CONFIG.maxSizeMB}MB per file
            </p>
          </div>

          {/* Format badges */}
          <div className="flex flex-wrap gap-2 justify-center mt-1">
            {UPLOAD_CONFIG.allowedTypes.map((type) => {
              const cfg = FILE_TYPE_CONFIG[type]
              return (
                <span
                  key={type}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  .{type}
                </span>
              )
            })}
          </div>
        </div>
      </label>

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-xl p-3"
          style={{ background: 'rgba(224,82,82,0.08)', color: 'var(--color-accent-red)' }}
        >
          <AlertCircle size={15} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
