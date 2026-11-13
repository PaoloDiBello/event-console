import type { RefObject } from 'react'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
import { hasCommandModifier, isShortcutBlocked } from '@/shared/lib/keyboard'

/**
 * "/" jumps to the search box and "f" jumps to the first column filter, the
 * way most data tools behave. Both are single-key shortcuts, so they stay out
 * of the way whenever a field or menu already owns the keyboard.
 */
export function useDataGridShortcuts(
  searchRef: RefObject<HTMLInputElement | null>,
  gridRef: RefObject<HTMLElement | null>,
) {
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (isShortcutBlocked(event.target)) return

    if (event.key === '/') {
      event.preventDefault()
      searchRef.current?.focus()
      return
    }

    if (event.key === 'f') {
      // The filter row can be scrolled out of view or disabled while loading;
      // the first usable control is the one worth revealing.
      const filter = gridRef.current?.querySelector<HTMLElement>(
        '[data-grid-filter]:not(:disabled)',
      )
      if (!filter) return
      event.preventDefault()
      filter.focus()
    }
  })
}
