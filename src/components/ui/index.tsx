import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  sub?: string
  accent?: boolean
}

export function StatCard({ label, value, icon, sub, accent }: StatCardProps) {
  return (
    <div
      className="p-5 rounded-2xl border transition-all hover:border-opacity-80"
      style={{
        background: accent ? 'rgba(37, 163, 104, 0.08)' : 'var(--color-bg-card)',
        borderColor: accent ? 'var(--color-brand-dim)' : 'var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: accent ? 'rgba(37, 163, 104, 0.15)' : 'var(--color-bg-elevated)',
            color: accent ? 'var(--color-brand)' : 'var(--color-text-secondary)',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

// Section header
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h2>
      {action}
    </div>
  )
}

// Empty state
export function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
      >
        {icon}
      </div>
      <p className="font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
    </div>
  )
}

// Badge
export function Badge({ label, color = 'brand' }: { label: string; color?: 'brand' | 'gold' | 'red' | 'gray' }) {
  const styles = {
    brand: { bg: 'rgba(37, 163, 104, 0.1)', color: 'var(--color-brand)', border: 'var(--color-border-light)' },
    gold: { bg: 'rgba(201, 168, 76, 0.1)', color: 'var(--color-accent-gold)', border: 'rgba(201, 168, 76, 0.3)' },
    red: { bg: 'rgba(224, 82, 82, 0.1)', color: 'var(--color-accent-red)', border: 'rgba(224, 82, 82, 0.3)' },
    gray: { bg: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)', border: 'var(--color-border)' },
  }
  const s = styles[color]
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {label}
    </span>
  )
}
