import { useEffect, useRef, useState } from 'react'

interface TransientOptions {
  /**
   * Holds the clock. A timeout nobody can stop takes an undo affordance away
   * while the reader is reaching for it — which is exactly the moment the
   * action still has to be available.
   */
  paused?: boolean
}

/**
 * A value that clears itself after `durationMs`.
 *
 * Toast messages and temporary row highlights both need the same timer
 * lifecycle; keeping it here means the cleanup rule is written once.
 *
 * Pausing keeps the time that was left instead of restarting the window, so
 * hovering a toast cannot keep it on screen forever, and a new message still
 * gets its whole duration.
 */
export function useTransientValue<T>(
  durationMs: number,
  { paused = false }: TransientOptions = {},
) {
  const [value, setValue] = useState<T | null>(null)
  /**
   * The window the running timer belongs to: which message, how long it lasts,
   * and what is left of it. Holding the three together lets the effect below
   * spot a new message and start its full window in one place, instead of a
   * second effect whose ordering against this one has to stay right.
   */
  const windowRef = useRef({ value: null as T | null, durationMs, remaining: durationMs })

  useEffect(() => {
    if (value === null || paused) return

    if (windowRef.current.value !== value || windowRef.current.durationMs !== durationMs) {
      windowRef.current = { value, durationMs, remaining: durationMs }
    }

    const startedAt = Date.now()
    const timer = window.setTimeout(() => setValue(null), windowRef.current.remaining)
    return () => {
      window.clearTimeout(timer)
      // Pausing hands back what was left; a replaced message is reset above, so
      // this subtraction can never shorten the next message's window.
      windowRef.current.remaining = Math.max(
        0,
        windowRef.current.remaining - (Date.now() - startedAt),
      )
    }
  }, [value, paused, durationMs])

  return [value, setValue] as const
}
