import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications — ambil notif user yang login
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const onlyUnread = url.searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (onlyUnread) query = query.eq('is_read', false)

    const { data, error } = await query
    if (error) throw error

    // Hitung unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    return NextResponse.json({ data, unread_count: unreadCount || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil notifikasi' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark as read (semua atau spesifik)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { id, mark_all } = body

    if (mark_all) {
      // Mark semua sebagai read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    } else if (id) {
      // Mark satu notif
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id)
    }

    return NextResponse.json({ message: 'Notifikasi diperbarui' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal update notifikasi' }, { status: 500 })
  }
}

// DELETE /api/notifications — hapus notif
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const deleteAll = url.searchParams.get('all') === 'true'

    if (deleteAll) {
      await supabase.from('notifications').delete().eq('user_id', user.id)
    } else if (id) {
      await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id)
    }

    return NextResponse.json({ message: 'Notifikasi dihapus' })
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus notifikasi' }, { status: 500 })
  }
}
