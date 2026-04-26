'use client'

import { Bell, Search } from 'lucide-react'
import { UserProfile } from '@/types'
import { getRoleLabel } from '@/lib/utils'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Header({ profile, title }: { profile: UserProfile; title?: string }) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  // Ambil unread count saat mount + poll tiap 30 detik
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=1')
        const json = await res.json()
        setUnreadCount(json.unread_count || 0)
      } catch {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(10, 15, 13, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left */}
      <div>
        {title && (
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Quick search */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
          onClick={() => router.push('/dashboard/pencarian')}
        >
          <Search size={14} />
          <span>Cari dokumen...</span>
          <kbd
            className="px-1.5 py-0.5 rounded text-xs font-mono"
            style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Notif bell — link ke halaman notifikasi */}
        <Link
          href="/dashboard/notifikasi"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          title={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Notifikasi'}
        >
          <Bell size={16} style={{ color: 'var(--color-text-secondary)' }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
              style={{ background: 'var(--color-accent-red)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Role badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-brand)' }}
          />
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {getRoleLabel(profile.role)}
          </span>
        </div>
      </div>
    </header>
  )
}
