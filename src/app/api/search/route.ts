import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q           = searchParams.get('q') || ''
  const file_type   = searchParams.get('file_type') || ''
  const category_id = searchParams.get('category_id') || ''
  const uploaded_by_role = searchParams.get('role') || ''
  const date_from   = searchParams.get('date_from') || ''
  const date_to     = searchParams.get('date_to') || ''
  const limit       = parseInt(searchParams.get('limit') || '20')
  const offset      = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('files')
      .select(`
        *,
        uploader:profiles!uploaded_by (id, full_name, role, prodi),
        category:categories (id, name, prodi)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Full-text search pada nama file
    if (q.trim()) {
      query = query.ilike('original_name', `%${q.trim()}%`)
    }

    if (file_type) query = query.eq('file_type', file_type)
    if (category_id) query = query.eq('category_id', category_id)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to)   query = query.lte('created_at', date_to + 'T23:59:59')

    const { data, count, error } = await query
    if (error) throw error

    // Filter by uploader role (post-process karena join)
    let filtered = data || []
    if (uploaded_by_role) {
      filtered = filtered.filter((f: any) => f.uploader?.role === uploaded_by_role)
    }

    return NextResponse.json({ data: filtered, total: count || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
