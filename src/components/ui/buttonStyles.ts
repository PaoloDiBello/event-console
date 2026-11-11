import { cn } from '@/shared/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'icon' | 'icon-sm'

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-sm border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/20',
  secondary: 'border-line bg-raised text-muted hover:border-line-strong hover:text-ink',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-raised hover:text-ink',
  danger: 'border-rose/30 bg-rose/10 text-rose hover:bg-rose/15',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-xs',
  icon: 'size-9',
  'icon-sm': 'size-8',
}

/**
 * One class builder for every button in the app. `<Button>` uses it, and Radix
 * triggers / ref-carrying buttons can use it directly without giving up their
 * element. Kept out of Button.tsx so Fast Refresh stays intact.
 */
export function buttonClass({
  variant = 'secondary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size], className)
}
