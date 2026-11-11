import { useEffect, useState } from 'react'

/**
 * A value that trails `value` by `delayMs`, resetting the timer on every
 * change.
 *
 * Search needs this: the input stays urgent, but the 100k-row filter pass must
 * wait for a pause in typing instead of running once per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
