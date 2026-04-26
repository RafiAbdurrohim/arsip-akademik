import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cek role admin
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const role    = searchParams.get('role') || ''
  const search  = searchParams.get('search') || ''
  const limit   = parseInt(searchParams.get('limit') || '20')
  const offset  = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role)   query = query.eq('role', role)
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ data: data || [], total: count || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
