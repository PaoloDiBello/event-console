import type { TimelineGroup } from './types'

export type TimelineFlatRow<TItem> =
  | {
      kind: 'group'
      key: string
      group: TimelineGroup<TItem>
      groupIndex: number
    }
  | {
      kind: 'item'
      key: string
      group: TimelineGroup<TItem>
      groupIndex: number
      item: TItem
      itemIndex: number
    }

export type TimelineItemRowData<TItem> = Extract<TimelineFlatRow<TItem>, { kind: 'item' }>

/** Flatten groups into the single row list the virtualizer renders. */
export function buildTimelineRows<TItem>(
  groups: readonly TimelineGroup<TItem>[],
  getItemId: (item: TItem) => string,
): TimelineFlatRow<TItem>[] {
  const rows: TimelineFlatRow<TItem>[] = []

  groups.forEach((group, groupIndex) => {
    rows.push({ kind: 'group', key: `g:${group.key}`, group, groupIndex })
    group.items.forEach((item, itemIndex) => {
      rows.push({
        kind: 'item',
        key: `i:${group.key}:${getItemId(item)}`,
        group,
        groupIndex,
        item,
        itemIndex,
      })
    })
  })

  return rows
}

export interface TimelineRowIndex {
  indexByKey: Map<string, number>
  firstItemIndexByGroup: Map<number, number>
}

/** Precompute the lookups keyboard navigation needs on every keypress. */
export function indexTimelineRows<TItem>(
  rows: readonly TimelineFlatRow<TItem>[],
): TimelineRowIndex {
  const indexByKey = new Map<string, number>()
  const firstItemIndexByGroup = new Map<number, number>()

  rows.forEach((row, index) => {
    indexByKey.set(row.key, index)
    if (row.kind === 'item' && !firstItemIndexByGroup.has(row.groupIndex)) {
      firstItemIndexByGroup.set(row.groupIndex, index)
    }
  })

  return { indexByKey, firstItemIndexByGroup }
}
