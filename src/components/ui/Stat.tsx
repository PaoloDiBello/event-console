import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface StatProps {
  icon: ReactNode
  label: string
  value: string
  tone?: string
  /** When set, the metric becomes a quick filter instead of a static label. */
  onClick?: () => void
  /** Pressed state for a quick filter that is currently applied. */
  active?: boolean
  title?: string
}

const BASE = 'flex h-9 items-center gap-2 rounded-sm border px-2.5 text-left'

/**
 * One metric, one height, on every page. The registry and the agenda show
 * different numbers, but they should read as the same object. When the metric
 * can narrow the view it becomes a button, so the number itself is the
 * affordance instead of a separate filter control.
 */
export function Stat({
  icon,
  label,
  value,
  tone = 'text-muted',
  onClick,
  active = false,
  title,
}: StatProps) {
  const content = (
    <>
      <span className={tone}>{icon}</span>
      <span className="tnum font-mono text-sm text-ink">{value}</span>
      <span
        className={cn(
          'font-mono text-[9px] tracking-wider whitespace-nowrap uppercase',
          active ? 'text-accent' : 'text-faint',
        )}
      >
        {label}
      </span>
    </>
  )

  if (!onClick) {
    return <div className={cn(BASE, 'border-line bg-surface/60')}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        BASE,
        'cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none',
        active
          ? 'border-accent/50 bg-accent/10'
          : 'border-line bg-surface/60 hover:border-line-strong hover:bg-raised',
      )}
    >
      {content}
    </button>
  )
}
