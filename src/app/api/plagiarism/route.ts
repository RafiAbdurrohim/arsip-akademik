import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkPlagiarism } from '@/lib/plagiarism'

// POST /api/plagiarism — trigger plagiarism check untuk file yang sudah ada
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { file_id } = await request.json()
    if (!file_id) return NextResponse.json({ error: 'file_id diperlukan' }, { status: 400 })

    // Ambil data file
    const { data: file, error } = await supabase
      .from('files').select('*').eq('id', file_id).single()
    if (error || !file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    // Cek hak akses: hanya owner, admin, dosen, perpustakaan
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()

    const allowedRoles = ['admin', 'dosen', 'perpustakaan', 'kaprodi']
    const isOwner = file.uploaded_by === user.id
    const hasRole = allowedRoles.includes(profile?.role || '')

    if (!isOwner && !hasRole)
      return NextResponse.json({ error: 'Tidak punya akses untuk cek plagiarisme' }, { status: 403 })

    // Jalankan cek plagiarisme
    const result = await checkPlagiarism(file.original_name)

    // Simpan score ke database
    const { error: updateError } = await supabase
      .from('files')
      .update({ plagiarism_score: result.score })
      .eq('id', file_id)

    if (updateError) console.error('Gagal update plagiarism score:', updateError)

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: user.id, action: 'plagiarism_check',
      resource_type: 'file', resource_id: file_id,
      metadata: { score: result.score, status: result.status, method: result.method },
    })

    return NextResponse.json({
      message: 'Cek plagiarisme selesai',
      data: result,
      file_id,
    })
  } catch (error: any) {
    console.error('Plagiarism API error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// GET /api/plagiarism?file_id=... — ambil result terakhir
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file_id = request.nextUrl.searchParams.get('file_id')
    if (!file_id) return NextResponse.json({ error: 'file_id diperlukan' }, { status: 400 })

    const { data: file, error } = await supabase
      .from('files')
      .select('id, original_name, plagiarism_score')
      .eq('id', file_id)
      .single()

    if (error || !file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })

    return NextResponse.json({
      file_id: file.id,
      filename: file.original_name,
      plagiarism_score: file.plagiarism_score,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
