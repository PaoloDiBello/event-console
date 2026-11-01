import { Activity, CalendarRange, Database, Plus, Table2 } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Kbd } from '@/components/ui/Kbd'
import { useEvents } from '@/features/events/store'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
import { cn } from '@/shared/lib/cn'
import { formatCount } from '@/shared/lib/format'
import { hasCommandModifier, isShortcutBlocked } from '@/shared/lib/keyboard'

interface AppHeaderProps {
  onNewEvent: () => void
}

/**
 * These are two lenses on the same event set, not separate destinations.
 * The labels match the page headings ("Event registry" / "Agenda"); the
 * icons carry the representation so the copy stays at the content level.
 */
const navItems = [
  {
    to: '/grid',
    label: 'Registry',
    description: 'Browse every event as records',
    icon: Table2,
    shortcut: 'G',
  },
  {
    to: '/timeline',
    label: 'Agenda',
    description: 'Browse events arranged by day',
    icon: CalendarRange,
    shortcut: 'T',
  },
] as const

export function AppHeader({ onNewEvent }: AppHeaderProps) {
  const events = useEvents()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isTimeline = pathname.startsWith('/timeline')

  // Fast switching without stealing keys from fields, dialogs or menus.
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (isShortcutBlocked(event.target)) return
    const key = event.key.toLowerCase()
    if (key !== 'g' && key !== 't') return
    event.preventDefault()
    navigate(key === 'g' ? '/grid' : '/timeline')
  })

  return (
    <header className="relative z-30 shrink-0 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 sm:gap-5">
        <NavLink to="/grid" className="flex items-center gap-2.5" aria-label="Event Console home">
          <span className="grid size-8 place-items-center rounded-sm border border-line-strong bg-raised">
            <Activity aria-hidden="true" className="size-4 text-accent" />
          </span>
          <span className="hidden font-mono text-[11px] font-medium tracking-[0.18em] text-ink sm:inline">
            EVENT<span className="text-accent">CONSOLE</span>
          </span>
        </NavLink>

        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-faint lg:inline"
          >
            View
          </span>
          <nav
            aria-label="Event views"
            className="relative grid grid-cols-2 rounded-md border border-line bg-surface/70 p-0.5"
          >
            {/* One surface slides between the two modes, so the control reads
                as a lens rather than two adjacent buttons. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0.5 grid grid-cols-2"
            >
              <span
                className={cn(
                  'col-start-1 row-start-1 rounded-[5px] bg-raised shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-transform duration-200 ease-out motion-reduce:transition-none',
                  isTimeline && 'translate-x-full',
                )}
              />
            </span>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={`${item.description} (${item.shortcut})`}
                  aria-keyshortcuts={item.shortcut.toLowerCase()}
                  className={({ isActive }) =>
                    cn(
                      'relative z-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                      isActive ? 'text-ink' : 'text-muted hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-3.5 transition-colors',
                          isActive ? 'text-accent' : 'text-faint',
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] tracking-wide text-faint md:inline-flex">
            <Database aria-hidden="true" className="size-3.5" />
            {formatCount(events.length)} events
          </span>
          <button
            type="button"
            onClick={onNewEvent}
            aria-label="New event"
            title="New event (N)"
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-sm border border-accent/40 bg-accent/15 px-2.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-accent sm:w-auto sm:justify-start sm:px-3"
          >
            <Plus aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">New event</span>
            <Kbd
              ariaHidden
              tone="accent"
              className="ml-1 hidden px-1.5 py-0.5 font-normal lg:inline-flex"
            >
              N
            </Kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
