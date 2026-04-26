import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/stats — statistik untuk laporan & dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    if (!profile || !['admin', 'kaprodi'].includes(profile.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // ── Total counts ──
    const [
      { count: totalFiles },
      { count: totalUsers },
      { count: totalMahasiswa },
      { count: totalDosen },
      { count: encryptedFiles },
    ] = await Promise.all([
      supabase.from('files').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'mahasiswa'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'dosen'),
      supabase.from('files').select('*', { count: 'exact', head: true }).eq('is_encrypted', true),
    ])

    // ── Upload per bulan (6 bulan terakhir) ──
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: recentFiles } = await supabase
      .from('files')
      .select('created_at, file_type, file_size')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by bulan
    const uploadByMonth: Record<string, number> = {}
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

    recentFiles?.forEach(f => {
      const d = new Date(f.created_at)
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`
      uploadByMonth[key] = (uploadByMonth[key] || 0) + 1
    })

    const uploadChartData = Object.entries(uploadByMonth).map(([month, count]) => ({
      month, count
    }))

    // ── Upload per tipe file ──
    const { data: allFiles } = await supabase.from('files').select('file_type, file_size')

    const byType: Record<string, { count: number; size: number }> = {}
    allFiles?.forEach(f => {
      if (!byType[f.file_type]) byType[f.file_type] = { count: 0, size: 0 }
      byType[f.file_type].count++
      byType[f.file_type].size += f.file_size || 0
    })

    const fileTypeData = Object.entries(byType).map(([type, data]) => ({
      type: type.toUpperCase(),
      count: data.count,
      size: data.size,
    }))

    // ── Total storage ──
    const totalStorage = allFiles?.reduce((acc, f) => acc + (f.file_size || 0), 0) || 0

    // ── Upload per role ──
    const { data: uploaderStats } = await supabase
      .from('files')
      .select('uploaded_by, profiles!uploaded_by(role)')

    const byRole: Record<string, number> = {}
    uploaderStats?.forEach((f: any) => {
      const role = f.profiles?.role || 'unknown'
      byRole[role] = (byRole[role] || 0) + 1
    })

    // ── Plagiarism stats ──
    const { data: plagFiles } = await supabase
      .from('files')
      .select('plagiarism_score')
      .not('plagiarism_score', 'is', null)

    const plagStats = {
      checked: plagFiles?.length || 0,
      clean: plagFiles?.filter(f => (f.plagiarism_score || 0) <= 15).length || 0,
      low: plagFiles?.filter(f => (f.plagiarism_score || 0) > 15 && (f.plagiarism_score || 0) <= 35).length || 0,
      medium: plagFiles?.filter(f => (f.plagiarism_score || 0) > 35 && (f.plagiarism_score || 0) <= 60).length || 0,
      high: plagFiles?.filter(f => (f.plagiarism_score || 0) > 60).length || 0,
    }

    // ── Recent audit logs ──
    const { data: recentActivity } = await supabase
      .from('audit_logs')
      .select('*, user:profiles!user_id(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      summary: {
        total_files: totalFiles || 0,
        total_users: totalUsers || 0,
        total_mahasiswa: totalMahasiswa || 0,
        total_dosen: totalDosen || 0,
        encrypted_files: encryptedFiles || 0,
        total_storage: totalStorage,
      },
      upload_chart: uploadChartData,
      file_type_data: fileTypeData,
      upload_by_role: byRole,
      plagiarism_stats: plagStats,
      recent_activity: recentActivity || [],
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 })
  }
}
