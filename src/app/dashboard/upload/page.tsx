'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Lock, ShieldCheck, X, ChevronRight, Info
} from 'lucide-react'
import { validateFile } from '@/lib/upload'
import { FILE_TYPE_CONFIG } from '@/lib/upload'

type Step = 'pick' | 'meta' | 'options' | 'uploading' | 'done'

interface UploadResult {
  data: any
  plagiarism?: any
  encrypted?: boolean
}

export default function UploadPage() {
  const router = useRouter()

  const [step, setStep]           = useState<Step>('pick')
  const [file, setFile]           = useState<File | null>(null)
  const [dragOver, setDragOver]   = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  // Form meta
  const [title, setTitle]       = useState('')
  const [subject, setSubject]   = useState('')
  const [year, setYear]         = useState(new Date().getFullYear().toString())
  const [semester, setSemester] = useState('1')
  const [type, setType]         = useState('tugas')

  // Fase 4: opsi enkripsi & plagiarism
  const [encrypt, setEncrypt]             = useState(false)
  const [checkPlagiarism, setCheckPlagiarism] = useState(false)

  // Upload state
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [result, setResult]         = useState<UploadResult | null>(null)

  // ============================================
  // File drop & select
  // ============================================
  const handleFile = useCallback((f: File) => {
    setFileError(null)
    const validation = validateFile(f)
    if (!validation.valid) { setFileError(validation.error || 'File tidak valid'); return }
    setFile(f)
    // Auto-fill title dari nama file
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    setStep('meta')
  }, [title])

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ============================================
  // Submit upload
  // ============================================
  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    setStep('uploading')

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('subject', subject)
      form.append('year', year)
      form.append('semester', semester)
      form.append('type', type)
      form.append('encrypt', encrypt.toString())
      form.append('check_plagiarism', checkPlagiarism.toString())

      const res  = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal upload')

      setResult({ data: data.data, plagiarism: data.plagiarism, encrypted: data.encrypted })
      setStep('done')
    } catch (err: any) {
      setUploadError(err.message)
      setStep('options')
    } finally {
      setUploading(false)
    }
  }

  const cfg = file ? FILE_TYPE_CONFIG[file.name.split('.').pop()?.toLowerCase() || ''] : null

  // ============================================
  // STEP: pick file
  // ============================================
  if (step === 'pick') return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Upload Dokumen
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Unggah file dengan opsi enkripsi AES-256 dan cek plagiarisme otomatis
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-12 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragOver ? 'var(--color-brand)' : 'var(--color-border)',
          background: dragOver ? 'rgba(37,163,104,0.04)' : 'var(--color-bg-card)',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: dragOver ? 'rgba(37,163,104,0.15)' : 'var(--color-bg-elevated)' }}
        >
          <Upload size={28} style={{ color: dragOver ? 'var(--color-brand)' : 'var(--color-text-muted)' }} />
        </div>
        <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {dragOver ? 'Lepaskan file di sini' : 'Drag & drop file ke sini'}
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          atau klik untuk pilih file
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['PDF', 'DOCX', 'XLSX', 'PPTX', 'ZIP', 'JPG', 'PNG'].map(t => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
            >
              .{t.toLowerCase()}
            </span>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>Maksimal 50MB</p>
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.pptx,.zip,.jpg,.jpeg,.png"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {fileError && (
        <div
          className="mt-4 flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(224,82,82,0.08)', color: 'var(--color-accent-red)' }}
        >
          <AlertCircle size={15} /> {fileError}
        </div>
      )}
    </div>
  )

  // ============================================
  // STEP: meta + options
  // ============================================
  if (step === 'meta' || step === 'options') return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Detail Dokumen
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Langkah 2 dari 3 — Isi informasi & pilih opsi keamanan</p>
      </div>

      {/* File info */}
      {file && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: cfg?.bg || 'var(--color-bg-elevated)' }}
          >
            {cfg?.icon || '📄'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {file.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB • {cfg?.label}
            </p>
          </div>
          <button
            onClick={() => { setFile(null); setStep('pick') }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Form */}
      <div
        className="rounded-2xl border p-5 space-y-4 mb-4"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Informasi Dokumen
        </p>
        {[
          { label: 'Judul Dokumen *', value: title, set: setTitle, placeholder: 'Contoh: Laporan Praktikum Basis Data' },
          { label: 'Mata Kuliah *', value: subject, set: setSubject, placeholder: 'Contoh: Basis Data' },
        ].map(field => (
          <div key={field.label}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {field.label}
            </label>
            <input
              type="text"
              value={field.value}
              onChange={e => field.set(e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        ))}

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Tahun', value: year, set: setYear,
              options: Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()),
            },
            {
              label: 'Semester', value: semester, set: setSemester,
              options: ['1', '2'],
            },
            {
              label: 'Tipe', value: type, set: setType,
              options: ['tugas', 'skripsi', 'laporan', 'jurnal', 'materi', 'lainnya'],
            },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                {field.label}
              </label>
              <select
                value={field.value}
                onChange={e => field.set(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {field.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Fase 4: Opsi Keamanan */}
      <div
        className="rounded-2xl border p-5 space-y-4 mb-6"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Opsi Keamanan & Kualitas
        </p>

        {/* Enkripsi toggle */}
        <div
          className="flex items-start justify-between gap-4 p-3.5 rounded-xl cursor-pointer transition-all"
          style={{
            background: encrypt ? 'rgba(37,163,104,0.06)' : 'var(--color-bg-elevated)',
            border: `1px solid ${encrypt ? 'var(--color-brand-dim)' : 'var(--color-border)'}`,
          }}
          onClick={() => setEncrypt(!encrypt)}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: encrypt ? 'rgba(37,163,104,0.15)' : 'var(--color-bg-card)',
                color: encrypt ? 'var(--color-brand)' : 'var(--color-text-muted)',
              }}
            >
              <Lock size={15} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Enkripsi AES-256
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                File dienkripsi sebelum disimpan. Hanya bisa dibaca oleh sistem ini.
              </p>
              {encrypt && (
                <div
                  className="mt-2 flex items-start gap-1.5 text-xs"
                  style={{ color: 'var(--color-brand)' }}
                >
                  <Info size={11} className="flex-shrink-0 mt-0.5" />
                  Pastikan ENCRYPTION_SECRET sudah diset di .env.local
                </div>
              )}
            </div>
          </div>
          {/* Toggle switch */}
          <div
            className="relative w-10 h-5 rounded-full flex-shrink-0 transition-all mt-1"
            style={{ background: encrypt ? 'var(--color-brand)' : 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{
                left: encrypt ? 'calc(100% - 18px)' : '2px',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Plagiarism toggle */}
        <div
          className="flex items-start justify-between gap-4 p-3.5 rounded-xl cursor-pointer transition-all"
          style={{
            background: checkPlagiarism ? 'rgba(74,158,255,0.06)' : 'var(--color-bg-elevated)',
            border: `1px solid ${checkPlagiarism ? 'rgba(74,158,255,0.3)' : 'var(--color-border)'}`,
          }}
          onClick={() => setCheckPlagiarism(!checkPlagiarism)}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: checkPlagiarism ? 'rgba(74,158,255,0.15)' : 'var(--color-bg-card)',
                color: checkPlagiarism ? '#4a9eff' : 'var(--color-text-muted)',
              }}
            >
              <ShieldCheck size={15} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Cek Plagiarisme
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Deteksi kemiripan dengan dokumen lain via Google Search. Gratis 100x/hari.
              </p>
            </div>
          </div>
          <div
            className="relative w-10 h-5 rounded-full flex-shrink-0 transition-all mt-1"
            style={{ background: checkPlagiarism ? '#4a9eff' : 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{
                left: checkPlagiarism ? 'calc(100% - 18px)' : '2px',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>
      </div>

      {uploadError && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm mb-4"
          style={{ background: 'rgba(224,82,82,0.08)', color: 'var(--color-accent-red)' }}
        >
          <AlertCircle size={15} /> {uploadError}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleUpload}
        disabled={!title.trim() || !subject.trim()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition-all"
        style={{
          background: title.trim() && subject.trim() ? 'var(--color-brand)' : 'var(--color-bg-elevated)',
          color: title.trim() && subject.trim() ? 'white' : 'var(--color-text-muted)',
        }}
      >
        Upload Sekarang
        {(encrypt || checkPlagiarism) && (
          <span className="text-xs opacity-70">
            {[encrypt && '🔒 Enkripsi', checkPlagiarism && '🔍 Cek Plagiarisme'].filter(Boolean).join(' + ')}
          </span>
        )}
        <ChevronRight size={16} />
      </button>
    </div>
  )

  // ============================================
  // STEP: uploading
  // ============================================
  if (step === 'uploading') return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(37,163,104,0.1)' }}
          >
            <Upload size={32} style={{ color: 'var(--color-brand)' }} className="animate-bounce" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Mengupload...
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {encrypt && checkPlagiarism
              ? 'Mengenkripsi file & mengecek plagiarisme...'
              : encrypt
              ? 'Mengenkripsi file dengan AES-256...'
              : checkPlagiarism
              ? 'Mengupload & mengecek plagiarisme...'
              : 'Menyimpan file ke storage...'}
          </p>
        </div>
        <div
          className="w-full max-w-xs h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          <div
            className="h-full rounded-full animate-pulse"
            style={{ width: '60%', background: 'var(--color-brand)' }}
          />
        </div>
      </div>
    </div>
  )

  // ============================================
  // STEP: done
  // ============================================
  if (step === 'done' && result) {
    const plagInfo = result.plagiarism
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(37,163,104,0.1)' }}
          >
            <CheckCircle2 size={32} style={{ color: 'var(--color-brand)' }} />
          </div>
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Upload Berhasil!
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {result.data?.original_name}
          </p>
        </div>

        {/* Status cards */}
        <div className="space-y-3 mb-6">
          {/* Enkripsi status */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: result.encrypted ? 'rgba(37,163,104,0.06)' : 'var(--color-bg-card)',
              border: `1px solid ${result.encrypted ? 'var(--color-brand-dim)' : 'var(--color-border)'}`,
            }}
          >
            <Lock size={18} style={{ color: result.encrypted ? 'var(--color-brand)' : 'var(--color-text-muted)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {result.encrypted ? '🔒 Terenkripsi AES-256' : 'Tidak dienkripsi'}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {result.encrypted ? 'File aman tersimpan terenkripsi' : 'File tersimpan tanpa enkripsi'}
              </p>
            </div>
          </div>

          {/* Plagiarism result */}
          {plagInfo && (
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Hasil Cek Plagiarisme
              </p>
              {/* Import PlagiarismBadge dynamically would be cleaner but inline for simplicity */}
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} style={{ color: '#4a9eff' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Skor Kemiripan: <strong style={{ color: plagInfo.score > 60 ? '#e05252' : plagInfo.score > 35 ? '#c9a84c' : '#25a368' }}>
                      {plagInfo.score}%
                    </strong>
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {plagInfo.score <= 15 ? 'Tidak terdeteksi kemiripan signifikan ✅'
                      : plagInfo.score <= 35 ? 'Kemiripan rendah, masih dapat diterima 🟡'
                      : plagInfo.score <= 60 ? 'Kemiripan sedang, perlu diperiksa ⚠️'
                      : 'Kemiripan tinggi, kemungkinan plagiarisme ❌'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard/arsip')}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm"
            style={{ background: 'var(--color-brand)', color: 'white' }}
          >
            Lihat di Arsip
          </button>
          <button
            onClick={() => {
              setFile(null); setTitle(''); setSubject('')
              setEncrypt(false); setCheckPlagiarism(false)
              setResult(null); setStep('pick')
            }}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm border"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            Upload Lagi
          </button>
        </div>
      </div>
    )
  }

  return null
}
