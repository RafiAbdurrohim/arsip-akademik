'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { UserRole } from '@/types'
import { BookOpen, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'mahasiswa', label: 'Mahasiswa', desc: 'Upload & akses tugas' },
  { value: 'dosen', label: 'Dosen', desc: 'Kelola materi & tugas' },
  { value: 'kaprodi', label: 'Kaprodi', desc: 'Akses laporan prodi' },
  { value: 'perpustakaan', label: 'Perpustakaan', desc: 'Kelola arsip' },
  { value: 'admin', label: 'Admin', desc: 'Akses penuh sistem' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'mahasiswa' as UserRole,
    nim: '',
    nip: '',
    prodi: '',
    angkatan: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName, form.role, {
        nim: form.nim || undefined,
        nip: form.nip || undefined,
        prodi: form.prodi || undefined,
        angkatan: form.angkatan || undefined,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registrasi gagal'
      if (message.includes('already registered')) {
        setError('Email sudah terdaftar')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center space-y-4 max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(37, 163, 104, 0.15)' }}
          >
            <CheckCircle size={32} style={{ color: 'var(--color-brand)' }} />
          </div>
          <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Registrasi Berhasil!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Cek email Anda untuk verifikasi akun, lalu login.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-brand)', color: 'white' }}
          >
            Ke Halaman Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-brand)' }}
          >
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold">ArsipKu</span>
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Buat Akun
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Daftarkan diri Anda ke sistem arsip akademik</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ background: 'rgba(224, 82, 82, 0.08)', borderColor: 'rgba(224, 82, 82, 0.3)' }}
          >
            <AlertCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
            <p className="text-sm" style={{ color: 'var(--color-accent-red)' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => update('role', r.value)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    background: form.role === r.value ? 'rgba(37, 163, 104, 0.12)' : 'var(--color-bg-card)',
                    borderColor: form.role === r.value ? 'var(--color-brand)' : 'var(--color-border)',
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: form.role === r.value ? 'var(--color-brand)' : 'var(--color-text-primary)' }}>
                    {r.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <InputField
            icon={<User size={16} />}
            label="Nama Lengkap"
            type="text"
            value={form.fullName}
            onChange={v => update('fullName', v)}
            placeholder="Nama lengkap sesuai KTP"
            required
          />

          {/* Email */}
          <InputField
            icon={<Mail size={16} />}
            label="Email"
            type="email"
            value={form.email}
            onChange={v => update('email', v)}
            placeholder="nama@kampus.ac.id"
            required
          />

          {/* Role-specific fields */}
          {form.role === 'mahasiswa' && (
            <div className="grid grid-cols-2 gap-4">
              <InputField label="NIM" type="text" value={form.nim} onChange={v => update('nim', v)} placeholder="NIM Mahasiswa" />
              <InputField label="Angkatan" type="text" value={form.angkatan} onChange={v => update('angkatan', v)} placeholder="2021" />
            </div>
          )}

          {(form.role === 'dosen' || form.role === 'kaprodi') && (
            <InputField label="NIP" type="text" value={form.nip} onChange={v => update('nip', v)} placeholder="NIP Dosen" />
          )}

          {form.role !== 'admin' && (
            <InputField label="Program Studi" type="text" value={form.prodi} onChange={v => update('prodi', v)} placeholder="Teknik Informatika" />
          )}

          {/* Password */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              icon={<Lock size={16} />}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={v => update('password', v)}
              placeholder="Min. 8 karakter"
              required
              rightAction={
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <InputField
              label="Konfirmasi Password"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={v => update('confirmPassword', v)}
              placeholder="Ulangi password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--color-brand)', color: 'white', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sudah punya akun?{' '}
          <a href="/auth/login" className="font-medium" style={{ color: 'var(--color-brand)' }}>
            Masuk di sini
          </a>
        </p>
      </div>
    </div>
  )
}

// Reusable input component
function InputField({
  icon, label, type, value, onChange, placeholder, required, rightAction
}: {
  icon?: React.ReactNode
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  rightAction?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full py-3 rounded-xl text-sm transition-all"
          style={{
            paddingLeft: icon ? '2.75rem' : '1rem',
            paddingRight: rightAction ? '3rem' : '1rem',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-brand)'
            e.target.style.boxShadow = '0 0 0 3px rgba(37, 163, 104, 0.1)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
        {rightAction && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightAction}</div>
        )}
      </div>
    </div>
  )
}
