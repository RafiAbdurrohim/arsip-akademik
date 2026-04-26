import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profil tidak ditemukan' }, { status: 404 })

    // Parse query params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const fileType = searchParams.get('file_type') || ''
    const categoryId = searchParams.get('category_id') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const myFilesOnly = searchParams.get('my_files') === 'true'

    // Build query
    let query = supabase
      .from('files')
      .select(`
        *,
        uploader:profiles!uploaded_by(id, full_name, email, role, nim, nip),
        assignment:assignments(*),
        category:categories(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by user untuk mahasiswa (hanya lihat file sendiri)
    if (profile.role === 'mahasiswa' || myFilesOnly) {
      query = query.eq('uploaded_by', user.id)
    }

    // Filter search
    if (search) {
      query = query.or(`original_name.ilike.%${search}%`)
    }

    // Filter file type
    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    // Filter category
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: files, error, count } = await query

    if (error) {
      console.error('Files query error:', error)
      return NextResponse.json({ error: 'Gagal mengambil data file' }, { status: 500 })
    }

    return NextResponse.json({
      data: files,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('GET /api/files error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
