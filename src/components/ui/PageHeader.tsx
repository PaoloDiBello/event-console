import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="shrink-0 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
          {/* On a phone the title and the data matter more than the pitch. */}
          <p className="mt-1 hidden max-w-2xl text-xs leading-relaxed text-muted sm:block">
            {description}
          </p>
        </div>
        {/* Full width on a phone so a page's own action block can lay itself
            out (metrics under actions) against the real content width; from
            `sm` up it shrinks to the row it shares with the title. */}
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  )
}
