import { Activity, Database, Menu, Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { formatCount } from '@/lib/format'
import { useEvents } from '@/store/events'

interface AppHeaderProps {
  onNewEvent: () => void
}

const navItems = [
  { to: '/grid', label: 'Data grid' },
  { to: '/timeline', label: 'Timeline' },
]

export function AppHeader({ onNewEvent }: AppHeaderProps) {
  const events = useEvents()

  return (
    <header className="relative z-30 shrink-0 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-3 px-4 sm:gap-6">
        <NavLink to="/grid" className="flex items-center gap-2.5" aria-label="Event Console home">
          <span className="grid size-8 place-items-center rounded-sm border border-line-strong bg-raised">
            <Activity aria-hidden="true" className="size-4 text-accent" />
          </span>
          <span className="hidden font-mono text-[11px] font-medium tracking-[0.18em] text-ink sm:inline">
            EVENT<span className="text-accent">CONSOLE</span>
          </span>
        </NavLink>

        <nav aria-label="Views" className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-raised text-ink shadow-[inset_0_-1px_0_0_var(--color-accent)]'
                    : 'text-muted hover:bg-raised/60 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 font-mono text-[10px] tracking-wide text-faint md:inline-flex">
            <Database aria-hidden="true" className="size-3.5" />
            {formatCount(events.length)} events
          </span>
          <button
            type="button"
            onClick={onNewEvent}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent/40 bg-accent/15 px-3 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-accent"
          >
            <Plus aria-hidden="true" className="size-4" />
            New event
            <kbd
              aria-hidden="true"
              className="ml-1 hidden rounded-xs border border-accent/30 bg-canvas/60 px-1.5 py-0.5 font-mono text-[10px] font-normal text-accent/80 sm:inline"
            >
              N
            </kbd>
          </button>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-sm border border-line text-muted transition-colors hover:text-ink sm:hidden"
            aria-label="Open navigation"
          >
            <Menu aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
