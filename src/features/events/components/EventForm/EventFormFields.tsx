import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/features/events/model'
import { EventDateField } from './EventDateField'
import { EventTimeField } from './EventTimeField'
import { Field } from './Field'
import { describeEnd } from './formValues'
import { DURATION_OPTIONS, type EventFormValues } from './schema'
import { inputClass, selectClass } from './styles'

interface EventFormFieldsProps {
  form: UseFormReturn<EventFormValues>
}

/**
 * `Field` renders the error/hint with an id derived from `htmlFor`, so the
 * input side of the relationship can be derived the same way.
 */
function fieldA11y(name: string, hasError: boolean, hintId?: string) {
  return {
    'aria-invalid': hasError,
    'aria-describedby': hasError ? `${name}-error` : hintId,
  }
}

/**
 * A native select with the browser chrome removed still needs a visible
 * chevron, otherwise it reads as a text input next to the real ones.
 */
function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-faint"
      />
    </div>
  )
}

export function EventFormFields({ form }: EventFormFieldsProps) {
  const {
    control,
    formState: { errors },
  } = form

  const startTime = useWatch({ control, name: 'startTime' })
  const durationMin = useWatch({ control, name: 'durationMin' })
  const end = describeEnd(startTime, durationMin)

  return (
    <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
      <Field
        label="Title"
        htmlFor="title"
        required
        error={errors.title?.message}
        className="sm:col-span-2"
      >
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <input
              {...field}
              id="title"
              type="text"
              autoComplete="off"
              autoCapitalize="sentences"
              placeholder="e.g. Deploy billing-api v3.2.0 to production"
              aria-required="true"
              {...fieldA11y('title', Boolean(errors.title))}
              className={inputClass}
            />
          )}
        />
      </Field>

      <Field
        label="Date"
        htmlFor="date"
        required
        error={errors.date?.message}
        hint={!errors.date ? 'Local calendar day (YYYY-MM-DD)' : undefined}
      >
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <EventDateField field={field} hasError={Boolean(errors.date)} />
          )}
        />
      </Field>

      <Field
        label="Start time"
        htmlFor="startTime"
        error={errors.startTime?.message}
        hint={end ? end.label : '24-hour time, e.g. 09:30'}
        tone={end?.spills ? 'warning' : undefined}
      >
        <Controller
          control={control}
          name="startTime"
          render={({ field }) => (
            <EventTimeField field={field} hasError={Boolean(errors.startTime)} />
          )}
        />
      </Field>

      <Field label="Duration" htmlFor="durationMin" error={errors.durationMin?.message}>
        <Controller
          control={control}
          name="durationMin"
          render={({ field }) => (
            <SelectShell>
              <select
                {...field}
                id="durationMin"
                className={selectClass}
                {...fieldA11y('durationMin', Boolean(errors.durationMin))}
              >
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </SelectShell>
          )}
        />
      </Field>

      <Field label="Category" htmlFor="category" error={errors.category?.message}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectShell>
              <select
                {...field}
                id="category"
                className={`${selectClass} capitalize`}
                {...fieldA11y('category', Boolean(errors.category))}
              >
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
            </SelectShell>
          )}
        />
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectShell>
              <select
                {...field}
                id="status"
                className={selectClass}
                {...fieldA11y('status', Boolean(errors.status))}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </SelectShell>
          )}
        />
      </Field>

      <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <SelectShell>
              <select
                {...field}
                id="priority"
                className={selectClass}
                {...fieldA11y('priority', Boolean(errors.priority))}
              >
                {EVENT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABEL[priority]}
                  </option>
                ))}
              </select>
            </SelectShell>
          )}
        />
      </Field>

      <Field label="Owner" htmlFor="owner" error={errors.owner?.message}>
        <Controller
          control={control}
          name="owner"
          render={({ field }) => (
            <input
              {...field}
              id="owner"
              type="text"
              autoComplete="name"
              autoCapitalize="words"
              placeholder="Unassigned"
              {...fieldA11y('owner', Boolean(errors.owner))}
              className={inputClass}
            />
          )}
        />
      </Field>

      <Field label="Location" htmlFor="location" error={errors.location?.message}>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <input
              {...field}
              id="location"
              type="text"
              autoComplete="off"
              autoCapitalize="words"
              placeholder="Remote"
              {...fieldA11y('location', Boolean(errors.location))}
              className={inputClass}
            />
          )}
        />
      </Field>

      <Field
        label="Notes"
        htmlFor="notes"
        error={errors.notes?.message}
        className="sm:col-span-2"
      >
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <textarea
              {...field}
              id="notes"
              rows={2}
              autoCapitalize="sentences"
              placeholder="Optional context for the attendees…"
              {...fieldA11y('notes', Boolean(errors.notes))}
              className={`${inputClass} h-auto resize-y py-2`}
            />
          )}
        />
      </Field>
    </div>
  )
}
