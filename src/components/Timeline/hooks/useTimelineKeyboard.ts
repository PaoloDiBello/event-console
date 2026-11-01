import { useCallback, type KeyboardEvent } from 'react'
import type { TimelineFlatRow } from '../timelineModel'
import type { TimelineGroup } from '../types'

interface TimelineKeyboardOptions<TItem> {
  groups: readonly TimelineGroup<TItem>[]
  flatRows: readonly TimelineFlatRow<TItem>[]
  indexByKey: Map<string, number>
  firstItemIndexByGroup: Map<number, number>
  focusRow: (index: number) => void
  onItemActivate?: (item: TItem) => void
}

/**
 * Keyboard model:
 * - ↑ / ↓  previous / next event, crossing day boundaries in reading order
 * - ← / →  first event of the previous / next day
 * - Home / End  first / last event
 * - Enter / Space  activate (open the editor)
 */
export function useTimelineKeyboard<TItem>({
  groups,
  flatRows,
  indexByKey,
  firstItemIndexByGroup,
  focusRow,
  onItemActivate,
}: TimelineKeyboardOptions<TItem>) {
  return useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>('[data-timeline-item]')
      if (!card) return
      const key = card.dataset.timelineItem
      if (!key) return
      const currentIndex = indexByKey.get(key)
      if (currentIndex === undefined) return
      const current = flatRows[currentIndex]
      if (!current || current.kind !== 'item') return

      let targetIndex: number | null = null

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          const step = event.key === 'ArrowDown' ? 1 : -1
          for (let i = currentIndex + step; i >= 0 && i < flatRows.length; i += step) {
            if (flatRows[i]?.kind === 'item') {
              targetIndex = i
              break
            }
          }
          break
        }
        case 'ArrowRight':
        case 'ArrowLeft': {
          const step = event.key === 'ArrowRight' ? 1 : -1
          for (
            let groupIndex = current.groupIndex + step;
            groupIndex >= 0 && groupIndex < groups.length;
            groupIndex += step
          ) {
            const candidate = firstItemIndexByGroup.get(groupIndex)
            if (candidate !== undefined) {
              targetIndex = candidate
              break
            }
          }
          break
        }
        case 'Home': {
          targetIndex = firstItemIndexByGroup.get(0) ?? null
          break
        }
        case 'End': {
          for (let i = flatRows.length - 1; i >= 0; i -= 1) {
            if (flatRows[i]?.kind === 'item') {
              targetIndex = i
              break
            }
          }
          break
        }
        case 'Enter':
        case ' ':
          event.preventDefault()
          onItemActivate?.(current.item)
          return
        default:
          return
      }

      event.preventDefault()
      if (targetIndex !== null) focusRow(targetIndex)
    },
    [groups.length, flatRows, indexByKey, firstItemIndexByGroup, focusRow, onItemActivate],
  )
}
