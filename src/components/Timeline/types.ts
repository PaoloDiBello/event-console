import type { ReactNode } from 'react'

export interface TimelineGroup<TItem> {
  /** Stable key, usually the day: `2026-10-29`. */
  key: string
  /** Full heading, e.g. `Thursday, 29 October`. */
  label: string
  /** Short form used in screen-reader announcements, e.g. `Thu 29 Oct`. */
  shortLabel?: string
  items: TItem[]
}

export interface TimelineProps<TItem> {
  groups: TimelineGroup<TItem>[]
  /** Must be stable (useCallback) — it is part of the flattening memo. */
  getItemId: (item: TItem) => string
  /** Concise, spoken description of one item. Used in the live region. */
  getItemLabel: (item: TItem) => string
  renderItem: (item: TItem) => ReactNode
  onItemActivate?: (item: TItem) => void
  /** Accessible name for the whole timeline region. */
  ariaLabel: string
  emptyState?: ReactNode
  itemHeight?: number
  groupHeight?: number
}
