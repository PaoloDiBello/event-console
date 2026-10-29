import { addDays, differenceInCalendarDays, format, isToday, isTomorrow, parseISO } from 'date-fns'

/** Local calendar day for `date`, e.g. `2026-10-29`. */
export function toIsoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso(): string {
  return toIsoDay(new Date())
}

/** Parse a `yyyy-MM-dd` string as local midnight (not UTC, which `new Date(str)` would do). */
export function parseIsoDay(iso: string): Date {
  return parseISO(iso)
}

export function shiftIsoDay(iso: string, days: number): string {
  return toIsoDay(addDays(parseIsoDay(iso), days))
}

export function daysFromToday(iso: string): number {
  return differenceInCalendarDays(parseIsoDay(iso), new Date())
}

/** `09:30` from minutes-from-midnight. */
export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Compact form for the dense grid: `29 Oct 2026`. */
export function formatGridDate(iso: string): string {
  return format(parseIsoDay(iso), 'dd MMM yyyy')
}

/** `Thursday, 29 October` — used by the timeline group headings. */
export function formatDayHeading(iso: string): string {
  return format(parseIsoDay(iso), 'EEEE, d MMMM')
}

/**
 * `Today` / `Tomorrow` / `Thu 29 Oct` — the short version for headers and
 * screen-reader announcements, where the full date would be noise.
 */
export function formatDayShort(iso: string): string {
  const date = parseIsoDay(iso)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE d MMM')
}

export function formatDayFull(iso: string): string {
  return format(parseIsoDay(iso), 'EEEE, d MMMM yyyy')
}
