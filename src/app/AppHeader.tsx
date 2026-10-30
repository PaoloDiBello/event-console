import { useEffect } from 'react'
import { Activity, CalendarRange, Database, Plus, Table2 } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import { useEvents } from '@/store/events'

interface AppHeaderProps {
  onNewEvent: () => void
}

/**
 * These are two lenses on the same event set, not separate destinations.
 * "Grid" is the record view and "Timeline" is the time view; the page heading
 * supplies the content name ("Event registry" / "Agenda").
 */
const navItems = [
  {
    to: '/grid',
    label: 'Grid',
    description: 'Browse every event as rows',
    icon: Table2,
    shortcut: 'G',
  },
  {
    to: '/timeline',
    label: 'Timeline',
    description: 'Browse events by day',
    icon: CalendarRange,
    shortcut: 'T',
  },
] as const

export function AppHeader({ onNewEvent }: AppHeaderProps) {
  const events = useEvents()
  const navigate = useNavigate()

  // Fast switching without stealing keys from fields, dialogs or menus.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]',
        )
      ) {
        return
      }
      const key = event.key.toLowerCase()
      if (key !== 'g' && key !== 't') return
      event.preventDefault()
      navigate(key === 'g' ? '/grid' : '/timeline')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navigate])

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
            className="flex items-center rounded-md border border-line bg-surface/70 p-0.5"
          >
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
                      'group inline-flex h-9 items-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                      isActive
                        ? 'bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]'
                        : 'text-muted hover:bg-raised/60 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-3.5 transition-colors',
                          isActive ? 'text-accent' : 'text-faint group-hover:text-muted',
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
            <kbd
              aria-hidden="true"
              className="ml-1 hidden rounded-xs border border-accent/30 bg-canvas/60 px-1.5 py-0.5 font-mono text-[10px] font-normal text-accent/80 lg:inline"
            >
              N
            </kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
