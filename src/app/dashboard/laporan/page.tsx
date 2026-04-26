'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { UserProfile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize, formatDateTime, getRoleLabel } from '@/lib/utils'
import {
  FileText, Users, HardDrive, Shield,
  TrendingUp, BarChart3, PieChart, Activity,
  Download, RefreshCw, AlertTriangle, CheckCircle
} from 'lucide-react'

interface Stats {
  summary: {
    total_files: number
    total_users: number
    total_mahasiswa: number
    total_dosen: number
    encrypted_files: number
    total_storage: number
  }
  upload_chart: { month: string; count: number }[]
  file_type_data: { type: string; count: number; size: number }[]
  upload_by_role: Record<string, number>
  plagiarism_stats: { checked: number; clean: number; low: number; medium: number; high: number }
  recent_activity: any[]
}

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF:  '#e05252',
  DOCX: '#4a9eff',
  XLSX: '#25a368',
  PPTX: '#f59e0b',
  ZIP:  '#8b5cf6',
  JPG:  '#ec4899',
  PNG:  '#06b6d4',
}

const ACTION_LABELS: Record<string, string> = {
  upload: 'Upload', download: 'Download', delete: 'Hapus', login: 'Login',
}

export default function LaporanPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }, [])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const json = await res.json()
      if (!json.error) setStats(json)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadStats() }, [loadStats])

  if (!profile) return null

  const maxUpload = stats ? Math.max(...stats.upload_chart.map(d => d.count), 1) : 1
  const maxFileType = stats ? Math.max(...stats.file_type_data.map(d => d.count), 1) : 1

  return (
    <div>
      <Header profile={profile} title="Laporan & Statistik" />
      <div className="p-6 space-y-6">

        {/* Actions bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Data diperbarui secara real-time dari database
          </p>
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-brand)' }} />
          </div>
        ) : !stats ? (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Gagal memuat statistik</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total File', value: stats.summary.total_files, icon: <FileText size={20} />, accent: true },
                { label: 'Total Pengguna', value: stats.summary.total_users, icon: <Users size={20} /> },
                { label: 'Storage Terpakai', value: formatFileSize(stats.summary.total_storage), icon: <HardDrive size={20} /> },
                { label: 'File Terenkripsi', value: stats.summary.encrypted_files, icon: <Shield size={20} /> },
              ].map(card => (
                <div
                  key={card.label}
                  className="p-5 rounded-2xl border"
                  style={{
                    background: card.accent ? 'rgba(37,163,104,0.08)' : 'var(--color-bg-card)',
                    borderColor: card.accent ? 'var(--color-brand-dim)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
                      <p className="text-2xl font-bold font-display mt-1" style={{ color: 'var(--color-text-primary)' }}>{card.value}</p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: card.accent ? 'rgba(37,163,104,0.15)' : 'var(--color-bg-elevated)',
                        color: card.accent ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload per bulan - bar chart */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: 'var(--color-brand)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Upload per Bulan</h3>
                </div>

                {stats.upload_chart.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data upload</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.upload_chart.map(d => (
                      <div key={d.month} className="flex items-center gap-3">
                        <span className="text-xs w-16 flex-shrink-0 text-right" style={{ color: 'var(--color-text-muted)' }}>{d.month}</span>
                        <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-elevated)' }}>
                          <div
                            className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                            style={{
                              width: `${Math.max(4, (d.count / maxUpload) * 100)}%`,
                              background: 'linear-gradient(90deg, var(--color-brand-dim), var(--color-brand))',
                            }}
                          />
                        </div>
                        <span className="text-xs w-6 text-right font-mono font-bold" style={{ color: 'var(--color-brand)' }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File type breakdown */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <PieChart size={16} style={{ color: 'var(--color-brand)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Distribusi Tipe File</h3>
                </div>

                {stats.file_type_data.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {stats.file_type_data.sort((a, b) => b.count - a.count).map(d => {
                      const color = FILE_TYPE_COLORS[d.type] || '#888'
                      return (
                        <div key={d.type} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                          <span className="text-xs font-mono font-bold w-12 flex-shrink-0" style={{ color }}>{d.type}</span>
                          <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: 'var(--color-bg-elevated)' }}>
                            <div
                              className="h-full rounded-lg"
                              style={{ width: `${Math.max(4, (d.count / maxFileType) * 100)}%`, background: `${color}60` }}
                            />
                          </div>
                          <span className="text-xs w-6 text-right font-mono" style={{ color: 'var(--color-text-secondary)' }}>{d.count}</span>
                          <span className="text-xs w-16 text-right" style={{ color: 'var(--color-text-muted)' }}>{formatFileSize(d.size)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Plagiarism stats */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} style={{ color: 'var(--color-accent-gold)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Statistik Plagiarisme</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Dicek', value: stats.plagiarism_stats.checked, color: 'var(--color-text-secondary)' },
                    { label: 'Aman (≤15%)', value: stats.plagiarism_stats.clean, color: 'var(--color-brand)' },
                    { label: 'Rendah (16-35%)', value: stats.plagiarism_stats.low, color: '#4a9eff' },
                    { label: 'Sedang (36-60%)', value: stats.plagiarism_stats.medium, color: 'var(--color-accent-gold)' },
                    { label: 'Tinggi (>60%)', value: stats.plagiarism_stats.high, color: 'var(--color-accent-red)' },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl"
                      style={{ background: 'var(--color-bg-elevated)' }}
                    >
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                      <p className="text-xl font-bold font-display mt-0.5" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload by role */}
              <div
                className="p-5 rounded-2xl border space-y-4"
                style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} style={{ color: 'var(--color-brand)' }} />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Upload per Role</h3>
                </div>

                {Object.keys(stats.upload_by_role).length === 0 ? (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.upload_by_role)
                      .sort(([, a], [, b]) => b - a)
                      .map(([role, count]) => {
                        const total = Object.values(stats.upload_by_role).reduce((a, b) => a + b, 0)
                        const pct = Math.round((count / total) * 100)
                        return (
                          <div key={role}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{getRoleLabel(role)}</span>
                              <span className="text-xs font-mono" style={{ color: 'var(--color-brand)' }}>{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-elevated)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: 'var(--color-brand)' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent activity */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <Activity size={16} style={{ color: 'var(--color-brand)' }} />
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Aktivitas Terbaru (Audit Log)</h3>
              </div>

              {stats.recent_activity.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada aktivitas</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Pengguna', 'Aksi', 'Detail', 'Waktu'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_activity.map((log, i) => (
                      <tr
                        key={log.id}
                        style={{ borderBottom: i < stats.recent_activity.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {log.user?.full_name || 'System'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {log.user?.role ? getRoleLabel(log.user.role) : ''}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              background: log.action === 'upload' ? 'rgba(37,163,104,0.1)' : log.action === 'delete' ? 'rgba(224,82,82,0.1)' : 'var(--color-bg-elevated)',
                              color: log.action === 'upload' ? 'var(--color-brand)' : log.action === 'delete' ? 'var(--color-accent-red)' : 'var(--color-text-secondary)',
                              borderColor: 'var(--color-border)',
                            }}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs truncate max-w-[200px]" style={{ color: 'var(--color-text-muted)' }}>
                          {log.metadata?.filename as string || log.resource_type}
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDateTime(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
