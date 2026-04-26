import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard, SectionHeader, Badge } from '@/components/ui'
import { UserProfile } from '@/types'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import { FileText, HardDrive, FolderOpen, Search } from 'lucide-react'
import Link from 'next/link'

export default async function PerpustakaanDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'perpustakaan') redirect('/dashboard')

  const { data: allFiles } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(10)
  const { count: totalFiles } = await supabase.from('files').select('*', { count: 'exact', head: true })
  const { data: categories } = await supabase.from('categories').select('*')

  return (
    <div>
      <Header profile={profile as UserProfile} title="Dashboard Perpustakaan" />
      <div className="p-6 space-y-8">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: 'linear-gradient(135deg, rgba(37,163,104,0.10) 0%, rgba(37,163,104,0.03) 100%)', borderColor: 'var(--color-brand-dim)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>Perpustakaan Digital</p>
          <h2 className="font-display text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Pengelola Arsip Akademik</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Arsip" value={totalFiles || 0} icon={<FileText size={20} />} accent />
          <StatCard label="Kategori" value={categories?.length || 0} icon={<FolderOpen size={20} />} />
          <StatCard label="Storage Total" value="—" icon={<HardDrive size={20} />} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/arsip"
            className="p-4 rounded-2xl border flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,163,104,0.12)', color: 'var(--color-brand)' }}>
              <FolderOpen size={20} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Kelola Arsip</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Lihat & kategorikan</p>
            </div>
          </Link>
          <Link
            href="/dashboard/pencarian"
            className="p-4 rounded-2xl border flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
              <Search size={20} />
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>Cari Dokumen</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Full-text search</p>
            </div>
          </Link>
        </div>

        <div>
          <SectionHeader title="Arsip Terbaru" />
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Nama File', 'Tipe', 'Ukuran', 'Diupload'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFiles?.map((file, i) => (
                  <tr key={file.id} style={{ borderBottom: i < (allFiles.length - 1) ? '1px solid var(--color-border)' : 'none' }}>
                    <td className="px-4 py-3 text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--color-text-primary)' }}>{file.original_name}</td>
                    <td className="px-4 py-3"><Badge label={file.file_type?.toUpperCase()} /></td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatFileSize(file.file_size)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(file.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
