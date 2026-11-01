import { useCallback, useState } from 'react'
import type { TimelineItemRowData } from '../timelineModel'

/**
 * The polite live region is what makes moving between day groups audible.
 * Position ("3 of 12") is part of the announcement so focus never moves
 * silently inside a long day.
 */
export function useTimelineAnnouncement<TItem>(getItemLabel: (item: TItem) => string) {
  const [announcement, setAnnouncement] = useState('')

  const announce = useCallback(
    (row: TimelineItemRowData<TItem>) => {
      const day = row.group.shortLabel ?? row.group.label
      setAnnouncement(
        `${day}: ${getItemLabel(row.item)}, ${row.itemIndex + 1} of ${row.group.items.length}`,
      )
    },
    [getItemLabel],
  )

  const clearAnnouncement = useCallback(() => setAnnouncement(''), [])

  return { announcement, announce, clearAnnouncement }
}
