import type { RefObject } from 'react'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
import { hasCommandModifier, isShortcutBlocked } from '@/shared/lib/keyboard'

/**
 * "/" jumps to the search box, the way most data tools behave.
 */
export function useDataGridShortcuts(searchRef: RefObject<HTMLInputElement | null>) {
  useGlobalKeydown((event) => {
    if (event.key !== '/' || event.defaultPrevented || event.repeat || hasCommandModifier(event)) {
      return
    }
    if (isShortcutBlocked(event.target)) return
    event.preventDefault()
    searchRef.current?.focus()
  })
}
