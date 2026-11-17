import { Check, Minus } from 'lucide-react'
import { useEffect, useRef, type ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  /** Draw the mixed state: some, but not all, of the group is selected. */
  indeterminate?: boolean
}

/**
 * A native checkbox wearing the console palette.
 *
 * The input stays native so Space, labels, focus and assistive tech keep
 * working; only the box is replaced. `indeterminate` is a DOM property rather
 * than an attribute, so it is written to the node after every render.
 */
export function Checkbox({ indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center align-middle">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'peer size-4 cursor-pointer appearance-none rounded-xs border border-line-strong bg-canvas transition-colors',
          'hover:border-faint',
          'checked:border-accent checked:bg-accent',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:opacity-40',
          className,
        )}
        {...props}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute size-3 text-canvas opacity-0 peer-checked:opacity-100"
      />
      <Minus
        aria-hidden="true"
        strokeWidth={3}
        className={cn(
          'pointer-events-none absolute size-3 text-canvas',
          indeterminate ? 'opacity-100' : 'opacity-0',
        )}
      />
    </span>
  )
}
