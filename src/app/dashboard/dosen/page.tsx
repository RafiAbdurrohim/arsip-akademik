import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import { StatCard, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { UserProfile } from '@/types'
import { formatFileSize, formatDateTime } from '@/lib/utils'
import { Upload, FileText, Users, BookOpen, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DosenDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'dosen') redirect('/dashboard')

  const { data: myFiles } = await supabase
    .from('files').select('*').eq('uploaded_by', user.id)
    .order('created_at', { ascending: false }).limit(6)

  const { count: totalFiles } = await supabase
    .from('files').select('*', { count: 'exact', head: true }).eq('uploaded_by', user.id)

  const totalStorage = myFiles?.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0

  return (
    <div>
      <Header profile={profile as UserProfile} title="Dashboard Dosen" />
      <div className="p-6 space-y-8">
        {/* Welcome */}
        <div
          className="p-6 rounded-2xl border relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(37,163,104,0.10) 0%, rgba(37,163,104,0.03) 100%)', borderColor: 'var(--color-brand-dim)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>Halo, Bapak/Ibu 👋</p>
            <h2 className="font-display text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>{profile.full_name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {profile.prodi || 'Program Studi'} {profile.nip ? `• NIP: ${profile.nip}` : ''}
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-brand)', color: 'white' }}
          >
            <Plus size={16} /> Upload Materi
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Materi Diupload" value={totalFiles || 0} icon={<FileText size={20} />} accent />
          <StatCard label="Storage Digunakan" value={formatFileSize(totalStorage)} icon={<Upload size={20} />} />
          <StatCard label="Mata Kuliah Aktif" value="—" icon={<BookOpen size={20} />} sub="Semester ini" />
        </div>

        <div>
          <SectionHeader
            title="Materi Terbaru"
            action={
              <Link href="/dashboard/arsip" className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-brand)' }}>
                Lihat semua <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            {!myFiles || myFiles.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title="Belum ada materi" desc="Upload materi kuliah pertama Anda" />
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Nama File', 'Tipe', 'Ukuran', 'Tanggal'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myFiles.map((file, i) => (
                    <tr key={file.id} style={{ borderBottom: i < myFiles.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td className="px-4 py-3 text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--color-text-primary)' }}>{file.original_name}</td>
                      <td className="px-4 py-3"><Badge label={file.file_type?.toUpperCase()} /></td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatFileSize(file.file_size)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(file.created_at)}</td>
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
