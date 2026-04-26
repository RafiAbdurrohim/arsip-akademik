'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Shield, Lock, Bell, Database, CheckCircle, Info } from 'lucide-react'

export default function PengaturanPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  function showSaved(label: string) {
    setSaved(label)
    setTimeout(() => setSaved(''), 2500)
  }

  if (!profile) return null

  const sections = [
    {
      icon: <Lock size={18} />,
      title: 'Enkripsi File',
      color: 'var(--color-brand)',
      bg: 'rgba(37,163,104,0.1)',
      items: [
        { label: 'Algoritma', value: 'AES-256-GCM', desc: 'Enkripsi simetris standar industri' },
        { label: 'Key Derivation', value: 'scrypt', desc: 'Salt unik per file, 256-bit key' },
        { label: 'Status', value: process.env.NEXT_PUBLIC_ENCRYPTION_ENABLED === 'false' ? 'Nonaktif' : 'Aktif', desc: 'Bisa diaktifkan per file saat upload' },
      ]
    },
    {
      icon: <Bell size={18} />,
      title: 'Notifikasi Sistem',
      color: '#4a9eff',
      bg: 'rgba(74,158,255,0.1)',
      items: [
        { label: 'Upload berhasil', value: 'Aktif', desc: 'Notif dikirim ke uploader' },
        { label: 'Plagiarisme tinggi', value: 'Aktif (>60%)', desc: 'Alert otomatis ke uploader' },
        { label: 'User baru', value: 'Aktif', desc: 'Admin diberitahu saat ada pendaftar baru' },
      ]
    },
    {
      icon: <Database size={18} />,
      title: 'Storage & Database',
      color: 'var(--color-accent-gold)',
      bg: 'rgba(201,168,76,0.1)',
      items: [
        { label: 'Provider', value: 'Supabase Storage', desc: 'Berbasis AWS S3 (MinIO compatible)' },
        { label: 'Database', value: 'PostgreSQL', desc: 'Dengan Row Level Security (RLS)' },
        { label: 'Max file size', value: '50 MB', desc: 'Per file upload' },
      ]
    },
    {
      icon: <Shield size={18} />,
      title: 'Keamanan & Audit',
      color: 'var(--color-accent-red)',
      bg: 'rgba(224,82,82,0.1)',
      items: [
        { label: 'Autentikasi', value: 'JWT + OAuth 2.0', desc: 'Via Supabase Auth' },
        { label: 'Otorisasi', value: 'RBAC', desc: 'Role-based access control (5 role)' },
        { label: 'Audit Log', value: 'Aktif', desc: 'Semua aksi upload/download/delete dicatat' },
      ]
    },
  ]

  return (
    <div>
      <Header profile={profile} title="Pengaturan Sistem" />
      <div className="p-6 max-w-3xl space-y-5">

        {/* Info banner */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ background: 'rgba(74,158,255,0.06)', borderColor: 'rgba(74,158,255,0.2)' }}
        >
          <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#4a9eff' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Halaman ini menampilkan konfigurasi sistem yang aktif. Untuk mengubah konfigurasi seperti enkripsi secret atau bucket storage, edit file <code className="px-1 py-0.5 rounded font-mono text-xs" style={{ background: 'var(--color-bg-elevated)' }}>.env.local</code> dan restart server.
          </p>
        </div>

        {/* Settings sections */}
        {sections.map(section => (
          <div
            key={section.title}
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            {/* Section header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: section.bg, color: section.color }}
              >
                {section.icon}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {section.title}
              </h3>
            </div>

            {/* Items */}
            {section.items.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < section.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold"
                  style={{ background: 'var(--color-bg-elevated)', color: section.color, border: `1px solid var(--color-border)` }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Env checklist */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
          >
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Checklist Environment Variables
            </h3>
          </div>
          {[
            { key: 'NEXT_PUBLIC_SUPABASE_URL', required: true, desc: 'URL project Supabase' },
            { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, desc: 'Publishable key Supabase' },
            { key: 'SUPABASE_SERVICE_ROLE_KEY', required: true, desc: 'Secret key Supabase (server only)' },
            { key: 'ENCRYPTION_SECRET', required: true, desc: 'Secret untuk enkripsi AES-256' },
            { key: 'GOOGLE_SEARCH_API_KEY', required: false, desc: 'Untuk plagiarism check (opsional)' },
            { key: 'GOOGLE_SEARCH_ENGINE_ID', required: false, desc: 'Custom Search Engine ID (opsional)' },
          ].map((env, i, arr) => (
            <div
              key={env.key}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={15} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
                <div>
                  <code className="text-xs font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{env.key}</code>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{env.desc}</p>
                </div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  color: env.required ? 'var(--color-accent-red)' : 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                }}
              >
                {env.required ? 'Wajib' : 'Opsional'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
