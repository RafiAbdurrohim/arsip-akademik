'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import {
  Bell, Upload, AlertTriangle, Users, Info,
  CheckCheck, Trash2, RefreshCw, BellOff
} from 'lucide-react'

interface Notification {
  id: string
  type: 'upload_success' | 'file_downloaded' | 'plagiarism_alert' | 'new_user' | 'system'
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

const TYPE_CONFIG = {
  upload_success:   { icon: <Upload size={16} />,        color: 'var(--color-brand)',      bg: 'rgba(37,163,104,0.12)' },
  file_downloaded:  { icon: <Bell size={16} />,          color: '#4a9eff',                 bg: 'rgba(74,158,255,0.12)' },
  plagiarism_alert: { icon: <AlertTriangle size={16} />, color: 'var(--color-accent-red)', bg: 'rgba(224,82,82,0.12)'  },
  new_user:         { icon: <Users size={16} />,         color: 'var(--color-accent-gold)',bg: 'rgba(201,168,76,0.12)' },
  system:           { icon: <Info size={16} />,          color: 'var(--color-text-muted)', bg: 'var(--color-bg-elevated)' },
}

export default function NotifikasiPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }, [])

  const loadNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filter === 'unread') params.set('unread', 'true')
      const res = await fetch(`/api/notifications?${params}`)
      const json = await res.json()
      setNotifs(json.data || [])
      setUnreadCount(json.unread_count || 0)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadNotifs() }, [loadNotifs])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    })
    loadNotifs()
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function deleteNotif(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  async function deleteAll() {
    if (!confirm('Hapus semua notifikasi?')) return
    await fetch('/api/notifications?all=true', { method: 'DELETE' })
    setNotifs([])
    setUnreadCount(0)
  }

  if (!profile) return null

  return (
    <div>
      <Header profile={profile} title="Notifikasi" />
      <div className="p-6 max-w-3xl space-y-5">

        {/* Header actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Filter tabs */}
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: filter === f ? 'var(--color-brand)' : 'var(--color-bg-card)',
                  color: filter === f ? 'white' : 'var(--color-text-secondary)',
                  border: `1px solid ${filter === f ? 'var(--color-brand)' : 'var(--color-border)'}`,
                }}
              >
                {f === 'all' ? 'Semua' : `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifs}
              className="p-2 rounded-xl transition-all"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-brand)' }}
              >
                <CheckCheck size={15} /> Tandai semua dibaca
              </button>
            )}
            {notifs.length > 0 && (
              <button
                onClick={deleteAll}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-accent-red)' }}
              >
                <Trash2 size={15} /> Hapus semua
              </button>
            )}
          </div>
        </div>

        {/* Notif list */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-bg-elevated)' }}>
                <BellOff size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p style={{ color: 'var(--color-text-secondary)' }}>Tidak ada notifikasi</p>
            </div>
          ) : (
            notifs.map((notif, i) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-4 px-5 py-4 transition-all cursor-pointer group"
                  style={{
                    borderBottom: i < notifs.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: notif.is_read ? 'transparent' : 'rgba(37,163,104,0.04)',
                  }}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: config.bg, color: config.color }}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
                        >
                          {notif.title}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {notif.message}
                        </p>
                        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDateTime(notif.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        {!notif.is_read && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(notif.id) }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--color-brand)' }}
                            title="Tandai dibaca"
                          >
                            <CheckCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif(notif.id) }}
                          className="p-1.5 rounded-lg transition-all"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ background: 'var(--color-brand)' }}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
