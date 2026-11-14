import { AlertTriangle, CalendarRange } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat } from '@/components/ui/Stat'
import { formatCount } from '@/shared/lib/format'
import type { TimelineScope } from './agendaData'

interface AgendaHeaderProps {
  scope: TimelineScope
  total: number
  atRisk: number
  /** True when the agenda is narrowed to at-risk events. */
  atRiskActive: boolean
  onToggleAtRisk: () => void
}

export function AgendaHeader({
  scope,
  total,
  atRisk,
  atRiskActive,
  onToggleAtRisk,
}: AgendaHeaderProps) {
  return (
    <PageHeader
      title="Agenda"
      description={`The next ${scope} days, grouped by day and virtualized. Arrow keys move between events and days; every move is announced with its day and position.`}
      actions={
        // Same two metrics, same cards as the registry header.
        <div className="flex items-center gap-2">
          <Stat
            icon={<CalendarRange aria-hidden="true" className="size-4" />}
            label="In window"
            value={formatCount(total)}
            tone="text-sky"
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
      }
    />
  )
}
