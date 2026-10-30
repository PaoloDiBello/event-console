import { z } from 'zod'
import { EVENT_CATEGORIES, EVENT_PRIORITIES, EVENT_STATUSES } from '@/data/types'

export const DURATION_OPTIONS = ['15', '30', '45', '60', '90', '120', '180'] as const

/** Rejects both bad shapes and impossible days such as 2026-02-31. */
export function isRealIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year!, month! - 1, day!)
  return (
    date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day
  )
}

export function parseTimeToMinute(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours! * 60 + minutes!
}

export const eventFormSchema = z.object({
  title: z
    .string()
    .refine((value) => value.trim().length > 0, 'Title is required')
    .refine((value) => value.trim().length <= 120, 'Keep the title under 120 characters'),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine(isRealIsoDay, 'Enter a valid date, e.g. 2026-10-29'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a time like 09:30'),
  durationMin: z.enum(DURATION_OPTIONS),
  category: z.enum(EVENT_CATEGORIES),
  status: z.enum(EVENT_STATUSES),
  priority: z.enum(EVENT_PRIORITIES),
  owner: z.string().refine((value) => value.trim().length <= 80, 'Keep the owner under 80 characters'),
  location: z
    .string()
    .refine((value) => value.trim().length <= 80, 'Keep the location under 80 characters'),
  notes: z.string().refine((value) => value.trim().length <= 500, 'Keep notes under 500 characters'),
})

export type EventFormValues = z.infer<typeof eventFormSchema>
