import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard, SectionHeader, Badge } from '@/components/ui'
import { UserProfile } from '@/types'
import { formatFileSize, formatDateTime, getRoleLabel } from '@/lib/utils'
import { Users, FileText, HardDrive, Activity, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Stats
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalFiles } = await supabase.from('files').select('*', { count: 'exact', head: true })
  const { data: recentFiles } = await supabase.from('files').select('*, uploader:profiles(full_name, role)').order('created_at', { ascending: false }).limit(8)
  const { data: recentUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)

  const roleColors: Record<string, 'brand' | 'gold' | 'red' | 'gray'> = {
    admin: 'red', dosen: 'brand', mahasiswa: 'gold', kaprodi: 'gray', perpustakaan: 'gray'
  }

  return (
    <div>
      <Header profile={profile as UserProfile} title="Dashboard Admin" />

      <div className="p-6 space-y-8">
        {/* Admin banner */}
        <div
          className="p-5 rounded-2xl border flex items-center gap-4"
          style={{ background: 'rgba(224,82,82,0.06)', borderColor: 'rgba(224,82,82,0.2)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(224,82,82,0.15)' }}>
            <Shield size={20} style={{ color: 'var(--color-accent-red)' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Mode Administrator</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Anda memiliki akses penuh ke seluruh sistem</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pengguna" value={totalUsers || 0} icon={<Users size={20} />} sub="Semua role" accent />
          <StatCard label="Total File" value={totalFiles || 0} icon={<FileText size={20} />} sub="Di seluruh sistem" />
          <StatCard label="Storage Terpakai" value="—" icon={<HardDrive size={20} />} sub="Estimasi total" />
          <StatCard label="Aktivitas Hari Ini" value="—" icon={<Activity size={20} />} sub="Login & upload" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent users */}
          <div>
            <SectionHeader
              title="Pengguna Terbaru"
              action={
                <Link href="/dashboard/pengguna" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-brand)' }}>
                  Kelola <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              {recentUsers?.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < (recentUsers.length - 1) ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(37,163,104,0.12)', color: 'var(--color-brand)' }}
                    >
                      {u.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{u.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{u.email}</p>
                    </div>
                  </div>
                  <Badge label={getRoleLabel(u.role)} color={roleColors[u.role] || 'gray'} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent files */}
          <div>
            <SectionHeader
              title="File Terbaru"
              action={
                <Link href="/dashboard/arsip" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-brand)' }}>
                  Lihat semua <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              {recentFiles?.map((file, i) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: i < (recentFiles.length - 1) ? '1px solid var(--color-border)' : 'none' }}
                >
                  <div>
                    <p className="text-sm font-medium truncate max-w-[180px]" style={{ color: 'var(--color-text-primary)' }}>
                      {file.original_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDateTime(file.created_at)}
                    </p>
                  </div>
                  <Badge label={file.file_type?.toUpperCase()} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
