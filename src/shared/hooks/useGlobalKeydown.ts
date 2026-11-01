import { useEffect, useRef } from 'react'

/**
 * Subscribe once and always call the latest handler. Shortcuts are a
 * cross-cutting concern, so the listener lifecycle lives here rather than in
 * every feature component.
 */
export function useGlobalKeydown(handler: (event: KeyboardEvent) => void) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handlerRef.current(event)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])
}
