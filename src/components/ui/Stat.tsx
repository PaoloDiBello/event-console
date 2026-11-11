import type { ReactNode } from 'react'

interface StatProps {
  icon: ReactNode
  label: string
  value: string
  tone?: string
}

/**
 * One metric, one height, on every page. The registry and the agenda show
 * different numbers, but they should read as the same object.
 */
export function Stat({ icon, label, value, tone = 'text-muted' }: StatProps) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-sm border border-line bg-surface/60 px-2.5">
      <span className={tone}>{icon}</span>
      <span className="tnum font-mono text-sm text-ink">{value}</span>
      <span className="font-mono text-[9px] tracking-wider whitespace-nowrap text-faint uppercase">
        {label}
      </span>
    </div>
  )
}
