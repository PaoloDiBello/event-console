import { useMemo } from 'react'
import {
  buildTimelineRows,
  indexTimelineRows,
  type TimelineFlatRow,
} from '../timelineModel'
import type { TimelineGroup } from '../types'

export interface TimelineModel<TItem> {
  flatRows: TimelineFlatRow<TItem>[]
  indexByKey: Map<string, number>
  firstItemIndexByGroup: Map<number, number>
  /** Changes when the day groups change, not when an item is added to a day. */
  groupsKey: string
}

/** Build the flattened row list and the keyboard lookup tables once per change. */
export function useTimelineModel<TItem>(
  groups: readonly TimelineGroup<TItem>[],
  getItemId: (item: TItem) => string,
): TimelineModel<TItem> {
  const flatRows = useMemo(() => buildTimelineRows(groups, getItemId), [groups, getItemId])
  const { indexByKey, firstItemIndexByGroup } = useMemo(
    () => indexTimelineRows(flatRows),
    [flatRows],
  )
  const groupsKey = useMemo(() => groups.map((group) => group.key).join('|'), [groups])

  return { flatRows, indexByKey, firstItemIndexByGroup, groupsKey }
}
