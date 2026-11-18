import { Activity, CalendarRange, Database, Keyboard, Plus, Table2 } from 'lucide-react'
import { useCallback } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { buttonClass } from '@/components/ui/buttonStyles'
import { Kbd } from '@/components/ui/Kbd'
import { selectedSegmentClass } from '@/components/ui/surfaces'
import { useEvents } from '@/features/events/store'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
import { cn } from '@/shared/lib/cn'
import { formatCount } from '@/shared/lib/format'
import { hasCommandModifier, isShortcutBlocked } from '@/shared/lib/keyboard'

interface AppHeaderProps {
  onNewEvent: () => void
  onOpenShortcuts: () => void
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

export function AppHeader({ onNewEvent, onOpenShortcuts }: AppHeaderProps) {
  const events = useEvents()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isTimeline = pathname.startsWith('/timeline')
  // Search is the one filter both lenses understand, so switching views keeps
  // it instead of silently dropping what the user just typed.
  const sharedQuery = searchParams.get('q')
  const withSharedQuery = useCallback(
    (path: string) => {
      if (!sharedQuery) return path
      const params = new URLSearchParams()
      params.set('q', sharedQuery)
      return `${path}?${params.toString()}`
    },
    [sharedQuery],
  )

  // Fast switching without stealing keys from fields, dialogs or menus.
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (isShortcutBlocked(event.target)) return
    const key = event.key.toLowerCase()
    if (key !== 'g' && key !== 't') return
    event.preventDefault()
    navigate(withSharedQuery(key === 'g' ? '/grid' : '/timeline'))
  })

  return (
    <header className="relative z-30 shrink-0 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="relative mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 sm:gap-5">
        <NavLink to="/grid" className="flex items-center gap-2.5" aria-label="Event Console home">
          <span className="grid size-8 place-items-center rounded-sm border border-line-strong bg-raised">
            <Activity aria-hidden="true" className="size-4 text-accent" />
          </span>
          <span className="hidden font-mono text-[11px] font-medium tracking-[0.18em] text-ink sm:inline">
            EVENT<span className="text-accent">CONSOLE</span>
          </span>
        </NavLink>

        {/* A capsule, not a framed pair of buttons: the two lenses share one
            track and the accent surface slides between them. From `xl` it takes
            the middle of the bar, so the header reads brand | lens | actions and
            the switch stops looking stranded in the gap after the wordmark. */}
        <nav
          aria-label="Event views"
          className={cn(
            // `overflow-hidden` keeps the selected surface's glow inside the
            // track instead of blooming over its hairline onto the header.
            'relative grid shrink-0 grid-cols-2 overflow-hidden rounded-full border border-line bg-canvas p-1',
            'shadow-[inset_0_1px_3px_rgb(0_0_0_/_0.55)]',
            'xl:absolute xl:top-1/2 xl:left-1/2 xl:-translate-x-1/2 xl:-translate-y-1/2',
          )}
        >
          {/* One surface slides between the two modes, so the control reads
              as a lens rather than two adjacent buttons. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-1 grid grid-cols-2">
            <span
              className={cn(
                'col-start-1 row-start-1 rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none',
                selectedSegmentClass,
                isTimeline && 'translate-x-full',
              )}
            />
          </span>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={withSharedQuery(item.to)}
                title={`${item.description} (${item.shortcut})`}
                aria-keyshortcuts={item.shortcut.toLowerCase()}
                className={({ isActive }) =>
                  cn(
                    'relative z-10 inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] whitespace-nowrap transition-[color,background-color,scale] duration-150 active:scale-[0.97] sm:h-8 sm:gap-2 sm:px-3.5 sm:text-xs',
                    // Inset so the focus ring is drawn inside the track instead
                    // of being clipped by it — and ink on the selected segment,
                    // whose own edge is already the accent, or the ring would
                    // be invisible exactly where the user's focus sits.
                    'focus-visible:outline-2 focus-visible:-outline-offset-2',
                    isActive
                      ? 'font-semibold text-ink focus-visible:outline-ink'
                      : 'font-medium text-muted hover:bg-accent/[0.07] hover:text-ink focus-visible:outline-accent',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        'size-4 transition-colors sm:size-3.5 xl:size-[15px]',
                        isActive ? 'text-accent' : 'text-faint',
                      )}
                    />
                    {item.label}
                    {/* The keys that switch views, shown only where the
                        header has room for them. */}
                    <Kbd
                      ariaHidden
                      tone={isActive ? 'accent' : 'faint'}
                      className="ml-0.5 hidden px-1 py-0 font-normal xl:inline-flex"
                    >
                      {item.shortcut}
                    </Kbd>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* `lg`, not `md`: between 768 and 1023 the count had to share a 736px
              bar with the wordmark, the switch, Shortcuts and New event, and
              wrapped both itself and the button onto two lines. */}
          <span className="hidden items-center gap-2 font-mono text-[10px] tracking-wide whitespace-nowrap text-faint lg:inline-flex">
            <Database aria-hidden="true" className="size-3.5" />
            {formatCount(events.length)} events
          </span>
          {/* No physical keyboard on a phone, so the button would only be an
              extra target; the `?` shortcut still works on desktop. The wrapper
              carries the hiding: `buttonClass` already sets `inline-flex`, and
              with a plain class merge the two display utilities would compete
              in the stylesheet rather than here. */}
          <div className="hidden sm:block">
            <button
              type="button"
              onClick={onOpenShortcuts}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              aria-keyshortcuts="?"
              className={buttonClass({ variant: 'ghost', size: 'md', className: 'px-2.5' })}
            >
              <Keyboard aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Shortcuts</span>
              <Kbd
                ariaHidden
                tone="faint"
                className="ml-0.5 hidden px-1.5 py-0.5 font-normal lg:inline-flex"
              >
                ?
              </Kbd>
            </button>
          </div>
          <button
            type="button"
            onClick={onNewEvent}
            aria-label="New event"
            title="New event (N)"
            className={buttonClass({
              variant: 'primary',
              size: 'md',
              className: 'px-2.5 font-semibold sm:px-3',
            })}
          >
            <Plus aria-hidden="true" className="size-4" />
            {/* A bare plus asked the reader to know what it adds. "New" fits
                the phone bar; the full label returns as soon as there is room. */}
            <span className="sm:hidden">New</span>
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
