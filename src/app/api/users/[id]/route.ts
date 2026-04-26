import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET single user + stats file-nya
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (admin?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile, error } = await supabase
    .from('profiles').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { count: fileCount } = await supabase
    .from('files').select('*', { count: 'exact', head: true })
    .eq('uploaded_by', params.id)

  return NextResponse.json({ data: profile, file_count: fileCount || 0 })
}

// PATCH - update role atau data user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (admin?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // Boleh update: role, full_name, prodi, angkatan
  const allowed = ['role', 'full_name', 'prodi', 'angkatan', 'nim', 'nip']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ data, message: 'Pengguna berhasil diperbarui' })
}

// DELETE - hapus user (admin only, tidak bisa hapus diri sendiri)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (params.id === user.id)
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })

  const { data: admin } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (admin?.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('profiles').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Pengguna berhasil dihapus' })
}
