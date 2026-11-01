import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type KbdTone = 'default' | 'faint' | 'accent'

const TONE: Record<KbdTone, string> = {
  default: 'border-line bg-raised text-muted',
  faint: 'border-line bg-raised text-faint',
  accent: 'border-accent/30 bg-canvas/60 text-accent/80',
}

interface KbdProps {
  children: ReactNode
  tone?: KbdTone
  className?: string
  title?: string
  ariaHidden?: boolean
}

/** Keyboard hint chip. Layout/display is left to the caller. */
export function Kbd({
  children,
  tone = 'default',
  className,
  title,
  ariaHidden,
}: KbdProps) {
  return (
    <kbd
      aria-hidden={ariaHidden}
      title={title}
      className={cn(
        'items-center justify-center rounded-xs border font-mono text-[10px]',
        TONE[tone],
        className,
      )}
    >
      {children}
    </kbd>
  )
}
