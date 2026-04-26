'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/layout/Header'
import { UserProfile } from '@/types'
import { getInitials, getRoleLabel, formatDate } from '@/lib/utils'
import { User, Mail, BookOpen, Hash, Calendar, Save, CheckCircle } from 'lucide-react'

export default function ProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ full_name: '', prodi: '', angkatan: '', nim: '', nip: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          full_name: data.full_name || '',
          prodi: data.prodi || '',
          angkatan: data.angkatan || '',
          nim: data.nim || '',
          nip: data.nip || '',
        })
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
      </div>
    )
  }

  return (
    <div>
      <Header profile={profile} title="Profil Saya" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Avatar card */}
        <div className="p-6 rounded-2xl border flex items-center gap-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold font-display flex-shrink-0"
            style={{ background: 'rgba(37,163,104,0.15)', color: 'var(--color-brand)' }}
          >
            {getInitials(profile.full_name)}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{profile.email}</p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-2 border"
              style={{ background: 'rgba(37,163,104,0.08)', color: 'var(--color-brand)', borderColor: 'var(--color-border-light)' }}
            >
              {getRoleLabel(profile.role)}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit Informasi</h3>

          {[
            { key: 'full_name', label: 'Nama Lengkap', icon: <User size={14} />, placeholder: 'Nama lengkap' },
            { key: 'prodi', label: 'Program Studi', icon: <BookOpen size={14} />, placeholder: 'Teknik Informatika' },
            ...(profile.role === 'mahasiswa' ? [
              { key: 'nim', label: 'NIM', icon: <Hash size={14} />, placeholder: 'NIM Mahasiswa' },
              { key: 'angkatan', label: 'Angkatan', icon: <Calendar size={14} />, placeholder: '2021' },
            ] : []),
            ...((profile.role === 'dosen' || profile.role === 'kaprodi') ? [
              { key: 'nip', label: 'NIP', icon: <Hash size={14} />, placeholder: 'NIP Dosen' },
            ] : []),
          ].map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{field.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>{field.icon}</span>
                <input
                  type="text"
                  value={(form as Record<string, string>)[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-brand)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)' }}
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: saved ? 'var(--color-brand-dim)' : 'var(--color-brand)', color: 'white' }}
          >
            {saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan'}
          </button>
        </form>

        {/* Info read-only */}
        <div className="p-6 rounded-2xl border space-y-3" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Informasi Akun</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>Email</p>
              <p className="font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{profile.email}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>Role</p>
              <p className="font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{getRoleLabel(profile.role)}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>Bergabung</p>
              <p className="font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{formatDate(profile.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
