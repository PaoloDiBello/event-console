import { AlertTriangle, CalendarClock, Gauge, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat } from '@/components/ui/Stat'
import { AGENDA_WINDOW_DAYS } from '@/features/events/model'
import type { LoadStatus } from '@/features/events/store'
import { formatCount } from '@/shared/lib/format'

interface RegistryHeaderProps {
  status: LoadStatus
  nextWindow: number
  atRisk: number
  /** True when the registry is currently narrowed to at-risk events. */
  atRiskActive: boolean
  onToggleAtRisk: () => void
  onOpenAgenda: () => void
  onReload: () => void
  onSimulateError: () => void
}

export function RegistryHeader({
  status,
  nextWindow,
  atRisk,
  atRiskActive,
  onToggleAtRisk,
  onOpenAgenda,
  onReload,
  onSimulateError,
}: RegistryHeaderProps) {
  return (
    <PageHeader
      title="Event registry"
      description="Every meeting, deploy, incident and release in one sortable archive. Filters run in the browser against all 100,000 rows — no server round-trips."
      actions={
        <>
          {/* Peer metrics: same card, same height, on both views. */}
          <div className="flex items-center gap-2">
            <Stat
              icon={<CalendarClock aria-hidden="true" className="size-4" />}
              label={`Next ${AGENDA_WINDOW_DAYS} days`}
              value={formatCount(nextWindow)}
              tone="text-sky"
              onClick={onOpenAgenda}
              title={`Open the ${AGENDA_WINDOW_DAYS}-day agenda`}
            />
            <Stat
              icon={<AlertTriangle aria-hidden="true" className="size-4" />}
              label="At risk"
              value={formatCount(atRisk)}
              tone="text-rose"
              active={atRiskActive}
              onClick={onToggleAtRisk}
              title={atRiskActive ? 'Show every status again' : 'Show only at-risk events'}
            />
          </div>
          <Button onClick={onReload} disabled={status === 'loading'}>
            <RefreshCw
              aria-hidden="true"
              className={status === 'loading' ? 'size-3.5 animate-spin' : 'size-3.5'}
            />
            Reload
          </Button>
          <Button
            onClick={onSimulateError}
            title="Demonstrates the DataGrid error state"
            className="bg-transparent text-faint hover:border-rose/30 hover:bg-transparent hover:text-rose"
          >
            <Gauge aria-hidden="true" className="size-3.5" />
            Simulate error
          </Button>
        </>
      }
    />
  )
}
