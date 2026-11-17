import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AlertTriangle, ArrowUpRight, CalendarClock, Ellipsis, Filter, Gauge, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonStyles'
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
      description="Every meeting, deploy, incident and release, filtered in your browser."
      actions={
        <>
          {/* Peer metrics: same card, same height, on both views. The trailing
              icon says what a click does — open the agenda, or narrow to at-risk.
              They wrap rather than shrink: below ~360px two cards do not fit on
              one line, and a truncated "AT RISK" is not a label. */}
          <div className="flex flex-wrap items-center gap-2">
            <Stat
              icon={<CalendarClock aria-hidden="true" className="size-4" />}
              // "45 days", not "Next 45 days": the card has to fit beside the
              // at-risk one on a 320px header, and the calendar icon plus the
              // card's title already say which window this is.
              label={`${AGENDA_WINDOW_DAYS} days`}
              value={formatCount(nextWindow)}
              tone="text-sky"
              onClick={onOpenAgenda}
              title={`Open the ${AGENDA_WINDOW_DAYS}-day agenda`}
              trailing={<ArrowUpRight aria-hidden="true" className="size-3.5" />}
            />
            <Stat
              icon={<AlertTriangle aria-hidden="true" className="size-4" />}
              label="At risk"
              value={formatCount(atRisk)}
              tone="text-rose"
              active={atRiskActive}
              onClick={onToggleAtRisk}
              title={atRiskActive ? 'Show every status again' : 'Show only at-risk events'}
              trailing={<Filter aria-hidden="true" className="size-3.5" />}
            />
          </div>
          {/* Reload and the overflow menu are one unit, so a narrow header wraps
              them together (right-aligned) instead of stranding the "…" alone
              on a line of its own. */}
          <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
            <Button
              onClick={onReload}
              disabled={status === 'loading'}
              aria-label="Reload the dataset"
              title="Reload the dataset"
            >
              <RefreshCw
                aria-hidden="true"
                className={status === 'loading' ? 'size-3.5 animate-spin' : 'size-3.5'}
              />
              <span className="hidden sm:inline">Reload</span>
            </Button>
            {/* The demo control no longer competes with Reload: it lives in a
                menu, so the header reads as product actions only. */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  aria-label="More registry actions"
                  title="More actions"
                  className={buttonClass({
                    variant: 'ghost',
                    size: 'icon',
                    className: 'text-faint hover:text-ink',
                  })}
                >
                  <Ellipsis aria-hidden="true" className="size-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  aria-label="More registry actions"
                  className="z-50 min-w-52 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
                >
                  <DropdownMenu.Label className="px-2 py-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
                    Demo
                  </DropdownMenu.Label>
                  <DropdownMenu.Item
                    onSelect={onSimulateError}
                    className="flex cursor-pointer items-center gap-2 rounded-xs px-2 py-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink"
                  >
                    <Gauge aria-hidden="true" className="size-3.5 text-faint" />
                    Simulate load error
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </>
      }
    />
  )
}
