import { AlertTriangle, CalendarClock, Gauge, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AGENDA_WINDOW_DAYS } from '@/features/events/model'
import type { LoadStatus } from '@/features/events/store'
import { formatCount } from '@/shared/lib/format'

interface RegistryHeaderProps {
  status: LoadStatus
  nextWindow: number
  atRisk: number
  onReload: () => void
  onSimulateError: () => void
}

function Stat({
  icon,
  label,
  value,
  tone = 'text-muted',
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-line bg-surface/60 px-3 py-2">
      <span className={tone}>{icon}</span>
      <span className="leading-none">
        <span className="tnum block font-mono text-sm text-ink">{value}</span>
        <span className="mt-1 block font-mono text-[10px] tracking-wider text-faint uppercase">
          {label}
        </span>
      </span>
    </div>
  )
}

export function RegistryHeader({
  status,
  nextWindow,
  atRisk,
  onReload,
  onSimulateError,
}: RegistryHeaderProps) {
  return (
    <PageHeader
      title="Event registry"
      description="Every meeting, deploy, incident and release in one sortable archive. Filters run in the browser against all 100,000 rows — no server round-trips."
      actions={
        <>
          {/* Peer metrics: one shared column width keeps the cards reading as a set. */}
          <div className="grid grid-cols-2 gap-2">
            <Stat
              icon={<CalendarClock aria-hidden="true" className="size-4" />}
              label={`Next ${AGENDA_WINDOW_DAYS} days`}
              value={formatCount(nextWindow)}
              tone="text-sky"
            />
            <Stat
              icon={<AlertTriangle aria-hidden="true" className="size-4" />}
              label="At risk"
              value={formatCount(atRisk)}
              tone="text-rose"
            />
          </div>
          <button
            type="button"
            onClick={onReload}
            disabled={status === 'loading'}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-raised px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
          >
            <RefreshCw
              aria-hidden="true"
              className={status === 'loading' ? 'size-3.5 animate-spin' : 'size-3.5'}
            />
            Reload
          </button>
          <button
            type="button"
            onClick={onSimulateError}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-2.5 text-xs text-faint transition-colors hover:border-rose/30 hover:text-rose"
            title="Demonstrates the DataGrid error state"
          >
            <Gauge aria-hidden="true" className="size-3.5" />
            Simulate error
          </button>
        </>
      }
    />
  )
}
