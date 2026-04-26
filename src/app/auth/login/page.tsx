'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { getDashboardByRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, BookOpen, Shield, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)

      // Ambil role dari profile
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Login gagal')

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dashboard = getDashboardByRole(profile?.role || 'mahasiswa')
      router.push(dashboard)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login gagal'
      if (message.includes('Invalid login credentials')) {
        setError('Email atau password salah')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* LEFT PANEL — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f1a14 0%, #0a2016 50%, #061208 100%)' }}
      >
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-border) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-brand)' }}
          >
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            ArsipKu
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest border"
            style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-brand)' }}
            />
            SISTEM ARSIP DIGITAL
          </div>

          <h1
            className="font-display text-5xl font-bold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Kelola Arsip
            <br />
            <span style={{ color: 'var(--color-brand-light)' }}>Akademik</span>
            <br />
            dengan Mudah
          </h1>

          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Platform terpadu untuk menyimpan, mencari, dan berbagi dokumen akademik
            dengan keamanan tingkat kampus.
          </p>

          {/* Feature list */}
          <div className="space-y-3 pt-2">
            {[
              { icon: Shield, text: 'Enkripsi AES-256 untuk keamanan file' },
              { icon: BookOpen, text: 'Manajemen arsip multi-format' },
              { icon: Lock, text: 'Akses berbasis peran (RBAC)' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37, 163, 104, 0.15)', border: '1px solid var(--color-border-light)' }}
                >
                  <Icon size={14} style={{ color: 'var(--color-brand)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © 2024 ArsipKu — Sistem Arsip Akademik Digital
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-brand)' }}
            >
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold">ArsipKu</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2
              className="font-display text-3xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Selamat Datang
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl border"
              style={{
                background: 'rgba(224, 82, 82, 0.08)',
                borderColor: 'rgba(224, 82, 82, 0.3)',
              }}
            >
              <AlertCircle size={16} style={{ color: 'var(--color-accent-red)' }} />
              <p className="text-sm" style={{ color: 'var(--color-accent-red)' }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@kampus.ac.id"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
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
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: loading ? 'var(--color-brand-dim)' : 'var(--color-brand)',
                color: 'white',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background = 'var(--color-brand-light)'
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.background = 'var(--color-brand)'
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Belum punya akun?{' '}
            <a
              href="/auth/register"
              className="font-medium transition-colors"
              style={{ color: 'var(--color-brand)' }}
            >
              Daftar sekarang
            </a>
          </p>

          {/* Role info */}
          <div
            className="p-4 rounded-xl border space-y-2"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              AKUN TERSEDIA UNTUK
            </p>
            <div className="flex flex-wrap gap-2">
              {['Admin', 'Dosen', 'Mahasiswa', 'Kaprodi', 'Perpustakaan'].map(role => (
                <span
                  key={role}
                  className="px-2 py-1 rounded-lg text-xs font-mono"
                  style={{
                    background: 'rgba(37, 163, 104, 0.08)',
                    color: 'var(--color-brand)',
                    border: '1px solid var(--color-border-light)',
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
