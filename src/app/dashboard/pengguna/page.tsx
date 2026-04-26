'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, RefreshCw, UserPlus, X, Filter } from 'lucide-react'
import { UserProfile } from '@/types'
import { EmptyState } from '@/components/ui'
import UserCard from '@/components/users/UserCard'
import { getRoleLabel } from '@/lib/utils'
import Link from 'next/link'

const ROLES = ['admin', 'dosen', 'mahasiswa', 'kaprodi', 'perpustakaan']

const ROLE_STATS_COLOR: Record<string, string> = {
  admin:        '#e05252',
  dosen:        '#4a9eff',
  mahasiswa:    '#25a368',
  kaprodi:      '#c9a84c',
  perpustakaan: '#a855f7',
}

export default function PenggunaPage() {
  const [users, setUsers]           = useState<(UserProfile & { file_count?: number })[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({})

  // Filters
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState('')

  // Pagination
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Load current user
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => setCurrentUserId(d.data?.id || ''))
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search && { search }),
        ...(filterRole && { role: filterRole }),
      })
      const res  = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data.data || [])
      setTotal(data.total || 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, filterRole, offset])

  // Load role counts for stats
  useEffect(() => {
    async function loadRoleCounts() {
      const counts: Record<string, number> = {}
      await Promise.all(
        ROLES.map(async (role) => {
          const res  = await fetch(`/api/users?role=${role}&limit=1`)
          const data = await res.json()
          counts[role] = data.total || 0
        })
      )
      setRoleCounts(counts)
    }
    loadRoleCounts()
  }, [users]) // refresh saat users berubah

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  async function handleDelete(id: string, name: string) {
    setDeleteTarget({ id, name })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setTotal(prev => prev - 1)
      } else {
        const d = await res.json()
        alert(d.error || 'Gagal menghapus pengguna')
      }
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole as any } : u))
    } else {
      const d = await res.json()
      alert(d.error || 'Gagal mengubah role')
    }
  }

  const clearFilters = () => {
    setSearch(''); setFilterRole(''); setOffset(0)
  }

  const hasFilters = search || filterRole

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Manajemen Pengguna
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? 'Memuat...' : `${total} pengguna terdaftar`}
          </p>
        </div>
        <Link
          href="/auth/register"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-brand)', color: 'white' }}
        >
          <UserPlus size={15} /> Tambah User
        </Link>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => { setFilterRole(filterRole === role ? '' : role); setOffset(0) }}
            className="p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02]"
            style={{
              background: filterRole === role
                ? `${ROLE_STATS_COLOR[role]}15`
                : 'var(--color-bg-card)',
              borderColor: filterRole === role
                ? `${ROLE_STATS_COLOR[role]}50`
                : 'var(--color-border)',
            }}
          >
            <p
              className="text-xl font-bold font-display"
              style={{ color: filterRole === role ? ROLE_STATS_COLOR[role] : 'var(--color-text-primary)' }}
            >
              {roleCounts[role] ?? '—'}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {getRoleLabel(role)}
            </p>
          </button>
        ))}
      </div>

      {/* Search & Filter bar */}
      <div
        className="rounded-2xl border p-4 mb-6 flex flex-wrap items-center gap-3"
        style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0) }}
            placeholder="Cari nama atau email..."
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm border focus:outline-none"
            style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border-light)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => { setFilterRole(filterRole === role ? '' : role); setOffset(0) }}
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
              style={{
                background: filterRole === role
                  ? `${ROLE_STATS_COLOR[role]}15`
                  : 'var(--color-bg-elevated)',
                color: filterRole === role
                  ? ROLE_STATS_COLOR[role]
                  : 'var(--color-text-muted)',
                border: `1px solid ${filterRole === role ? ROLE_STATS_COLOR[role] + '40' : 'var(--color-border)'}`,
              }}
            >
              {getRoleLabel(role)}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear + Refresh */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
            style={{ color: 'var(--color-accent-red)', background: 'rgba(224,82,82,0.08)' }}
          >
            <X size={11} /> Reset
          </button>
        )}
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="p-2 rounded-xl transition-all"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Users grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-36" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={hasFilters ? 'Tidak ada pengguna sesuai filter' : 'Belum ada pengguna'}
          desc={hasFilters ? 'Coba ubah filter pencarian' : 'Tambah pengguna baru dengan tombol di atas'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Menampilkan {offset + 1}–{Math.min(offset + limit, total)} dari {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: offset === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    opacity: offset === 0 ? 0.5 : 1,
                  }}
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: offset + limit >= total ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    opacity: offset + limit >= total ? 0.5 : 1,
                  }}
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-6 text-center"
            style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(224,82,82,0.1)' }}
            >
              <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            </div>
            <h3 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Hapus Pengguna?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Akun <strong style={{ color: 'var(--color-text-primary)' }}>{deleteTarget.name}</strong> akan dihapus permanen beserta semua datanya.
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{
                  background: 'var(--color-bg-elevated)',
                  color: 'var(--color-text-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--color-accent-red)', color: 'white', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
