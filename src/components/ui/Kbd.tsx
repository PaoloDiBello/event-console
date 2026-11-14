import type { ComponentType, ReactNode, SVGProps } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornerDownLeft,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type KbdTone = 'default' | 'faint' | 'accent'

const TONE: Record<KbdTone, string> = {
  default: 'border-line bg-raised text-muted',
  faint: 'border-line bg-raised text-faint',
  accent: 'border-accent/30 bg-canvas/60 text-accent/80',
}

interface KeyGlyph {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
}

const KEY_GLYPHS: Record<string, KeyGlyph> = {
  '↑': { icon: ArrowUp, label: 'Up arrow' },
  '↓': { icon: ArrowDown, label: 'Down arrow' },
  '←': { icon: ArrowLeft, label: 'Left arrow' },
  '→': { icon: ArrowRight, label: 'Right arrow' },
  '↵': { icon: CornerDownLeft, label: 'Enter' },
  ArrowUp: { icon: ArrowUp, label: 'Up arrow' },
  ArrowDown: { icon: ArrowDown, label: 'Down arrow' },
  ArrowLeft: { icon: ArrowLeft, label: 'Left arrow' },
  ArrowRight: { icon: ArrowRight, label: 'Right arrow' },
  Enter: { icon: CornerDownLeft, label: 'Enter' },
}

interface KbdProps {
  children: ReactNode
  tone?: KbdTone
  className?: string
  title?: string
  ariaHidden?: boolean
}

/** Keyboard hint chip. Renders SVG icons for arrows and Enter. */
export function Kbd({
  children,
  tone = 'default',
  className,
  title,
  ariaHidden,
}: KbdProps) {
  const glyph =
    typeof children === 'string' && children in KEY_GLYPHS
      ? KEY_GLYPHS[children]
      : undefined

  const Icon = glyph?.icon

  return (
    <kbd
      aria-hidden={ariaHidden}
      aria-label={glyph && !ariaHidden ? glyph.label : undefined}
      title={title ?? glyph?.label}
      className={cn(
        'items-center justify-center rounded-xs border font-mono text-[10px]',
        TONE[tone],
        className,
      )}
    >
      {Icon ? <Icon aria-hidden="true" className="size-2.5 shrink-0" /> : children}
    </kbd>
  )
}

