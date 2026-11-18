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
 * hovering a toast cannot be used to keep it on screen forever, and a new
 * message still gets its whole duration.
 */
export function useTransientValue<T>(
  durationMs: number,
  { paused = false }: TransientOptions = {},
) {
  const [value, setValue] = useState<T | null>(null)
  /** What the current message has left; carried across pauses. */
  const remainingRef = useRef(durationMs)
  const lastValueRef = useRef<T | null>(null)

  // A different message is a fresh window, even if the last one was paused.
  useEffect(() => {
    if (lastValueRef.current === value) return
    lastValueRef.current = value
    remainingRef.current = durationMs
  }, [value, durationMs])

  useEffect(() => {
    if (value === null || paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => setValue(null), remainingRef.current)
    return () => {
      window.clearTimeout(timer)
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt))
    }
  }, [value, paused])

  return [value, setValue] as const
}
