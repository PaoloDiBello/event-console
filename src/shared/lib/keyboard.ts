import { useEffect, useRef } from 'react'

/**
 * Elements that own the keyboard. Global single-key shortcuts must never run
 * while one of these is focused, and overlays must not change the view behind
 * the user.
 */
const SHORTCUT_BLOCKERS =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"], [role="listbox"]'

export function isShortcutBlocked(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(SHORTCUT_BLOCKERS))
}

export function hasCommandModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey
}

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
