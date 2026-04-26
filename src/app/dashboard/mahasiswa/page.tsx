import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { UserProfile } from '@/types'
import { formatFileSize, formatDateTime, getFileTypeColor } from '@/lib/utils'
import { Upload, FileText, Search, Clock, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function MahasiswaDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'mahasiswa') redirect('/auth/login')

  // Fetch stats
  const { data: myFiles } = await supabase
    .from('files')
    .select('*')
    .eq('uploaded_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: totalFiles } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('uploaded_by', user.id)

  const totalStorage = myFiles?.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0

  return (
    <div>
      <Header profile={profile as UserProfile} title="Dashboard Mahasiswa" />

      <div className="p-6 space-y-8">
        {/* Welcome */}
        <div
          className="p-6 rounded-2xl border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(37,163,104,0.12) 0%, rgba(37,163,104,0.04) 100%)',
            borderColor: 'var(--color-brand-dim)',
          }}
        >
          <div className="relative z-10">
            <p className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>Selamat datang kembali 👋</p>
            <h2 className="font-display text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {profile.full_name}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.prodi || 'Program Studi belum diisi'} {profile.angkatan ? `• Angkatan ${profile.angkatan}` : ''}
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--color-brand)', color: 'white' }}
          >
            <Plus size={16} />
            Upload File
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total File Saya"
            value={totalFiles || 0}
            icon={<FileText size={20} />}
            sub="File yang diupload"
            accent
          />
          <StatCard
            label="Storage Digunakan"
            value={formatFileSize(totalStorage)}
            icon={<Upload size={20} />}
            sub="Dari total quota"
          />
          <StatCard
            label="Upload Bulan Ini"
            value={myFiles?.filter(f => new Date(f.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0}
            icon={<Clock size={20} />}
            sub="30 hari terakhir"
          />
        </div>

        {/* Quick actions */}
        <div>
          <SectionHeader title="Aksi Cepat" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Upload Tugas', href: '/dashboard/upload', icon: <Upload size={20} />, color: 'var(--color-brand)' },
              { label: 'Cari Dokumen', href: '/dashboard/pencarian', icon: <Search size={20} />, color: '#6366f1' },
              { label: 'File Saya', href: '/dashboard/arsip', icon: <FileText size={20} />, color: '#f59e0b' },
              { label: 'Profil Saya', href: '/dashboard/profil', icon: <Clock size={20} />, color: '#8b5cf6' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="p-4 rounded-2xl border flex flex-col items-center gap-3 text-center transition-all hover:scale-[1.02]"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}20`, color: item.color }}
                >
                  {item.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent files */}
        <div>
          <SectionHeader
            title="File Terbaru Saya"
            action={
              <Link href="/dashboard/arsip" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-brand)' }}>
                Lihat semua <ArrowRight size={12} />
              </Link>
            }
          />
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            {!myFiles || myFiles.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title="Belum ada file" desc="Upload file pertama Anda" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Nama File', 'Tipe', 'Ukuran', 'Diupload'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myFiles.map((file, i) => (
                    <tr
                      key={file.id}
                      style={{ borderBottom: i < myFiles.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--color-text-primary)' }}>
                          {file.original_name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={file.file_type?.toUpperCase()} />
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatFileSize(file.file_size)}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDateTime(file.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
