import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard, SectionHeader } from '@/components/ui'
import { UserProfile } from '@/types'
import { FileText, Users, BarChart3, TrendingUp } from 'lucide-react'

export default async function KaprodiDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'kaprodi') redirect('/dashboard')

  const { count: totalFiles } = await supabase.from('files').select('*', { count: 'exact', head: true })
  const { count: totalMahasiswa } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa')
  const { count: totalDosen } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen')

  return (
    <div>
      <Header profile={profile as UserProfile} title="Dashboard Kaprodi" />
      <div className="p-6 space-y-8">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: 'linear-gradient(135deg, rgba(37,163,104,0.10) 0%, rgba(37,163,104,0.03) 100%)', borderColor: 'var(--color-brand-dim)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>Kepala Program Studi</p>
          <h2 className="font-display text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{profile.prodi || 'Program Studi'}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Arsip" value={totalFiles || 0} icon={<FileText size={20} />} accent />
          <StatCard label="Mahasiswa Aktif" value={totalMahasiswa || 0} icon={<Users size={20} />} />
          <StatCard label="Dosen" value={totalDosen || 0} icon={<Users size={20} />} />
          <StatCard label="Laporan Bulan Ini" value="—" icon={<TrendingUp size={20} />} />
        </div>

        <div>
          <SectionHeader title="Ringkasan Prodi" />
          <div
            className="p-8 rounded-2xl border flex items-center justify-center"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', minHeight: '200px' }}
          >
            <div className="text-center space-y-2">
              <BarChart3 size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto' }} />
              <p style={{ color: 'var(--color-text-secondary)' }}>Grafik & laporan akan tersedia setelah data tersedia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
