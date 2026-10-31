import type { UseFormReturn } from 'react-hook-form'
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from '@/features/events/model'
import { Field } from './Field'
import {
  DURATION_OPTIONS,
  isRealIsoDay,
  type EventFormValues,
} from './schema'
import { inputClass, selectClass } from './styles'

interface EventFormFieldsProps {
  form: UseFormReturn<EventFormValues>
}

export function EventFormFields({ form }: EventFormFieldsProps) {
  const { errors } = form.formState

  return (
    <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
      <Field
        label="Title"
        htmlFor="title"
        required
        error={errors.title?.message}
        className="sm:col-span-2"
      >
        <input
          id="title"
          type="text"
          autoComplete="off"
          placeholder="e.g. Deploy billing-api v3.2.0 to production"
          aria-required="true"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={inputClass}
          {...form.register('title')}
        />
      </Field>

      <Field
        label="Date"
        htmlFor="date"
        required
        error={errors.date?.message}
        hint={!errors.date ? 'Local calendar day' : undefined}
      >
        <input
          id="date"
          type="date"
          aria-required="true"
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'date-error' : 'date-hint'}
          className={inputClass}
          {...form.register('date', {
            validate: (value) => isRealIsoDay(value) || 'Enter a valid date, e.g. 2026-10-29',
          })}
        />
      </Field>

      <Field label="Start time" htmlFor="startTime" error={errors.startTime?.message}>
        <input
          id="startTime"
          type="time"
          step={300}
          aria-invalid={Boolean(errors.startTime)}
          aria-describedby={errors.startTime ? 'startTime-error' : undefined}
          className={inputClass}
          {...form.register('startTime')}
        />
      </Field>

      <Field label="Duration" htmlFor="durationMin" error={errors.durationMin?.message}>
        <select
          id="durationMin"
          className={selectClass}
          aria-invalid={Boolean(errors.durationMin)}
          aria-describedby={errors.durationMin ? 'durationMin-error' : undefined}
          {...form.register('durationMin')}
        >
          {DURATION_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category" htmlFor="category" error={errors.category?.message}>
        <select
          id="category"
          className={selectClass}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? 'category-error' : undefined}
          {...form.register('category')}
        >
          {EVENT_CATEGORIES.map((category) => (
            <option key={category} value={category} className="capitalize">
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <select
          id="status"
          className={selectClass}
          aria-invalid={Boolean(errors.status)}
          aria-describedby={errors.status ? 'status-error' : undefined}
          {...form.register('status')}
        >
          {EVENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
        <select
          id="priority"
          className={selectClass}
          aria-invalid={Boolean(errors.priority)}
          aria-describedby={errors.priority ? 'priority-error' : undefined}
          {...form.register('priority')}
        >
          {EVENT_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Owner" htmlFor="owner" error={errors.owner?.message}>
        <input
          id="owner"
          type="text"
          autoComplete="off"
          placeholder="Unassigned"
          aria-invalid={Boolean(errors.owner)}
          aria-describedby={errors.owner ? 'owner-error' : undefined}
          className={inputClass}
          {...form.register('owner')}
        />
      </Field>

      <Field label="Location" htmlFor="location" error={errors.location?.message}>
        <input
          id="location"
          type="text"
          autoComplete="off"
          placeholder="Remote"
          aria-invalid={Boolean(errors.location)}
          aria-describedby={errors.location ? 'location-error' : undefined}
          className={inputClass}
          {...form.register('location')}
        />
      </Field>

      <Field
        label="Notes"
        htmlFor="notes"
        error={errors.notes?.message}
        className="sm:col-span-2"
      >
        <textarea
          id="notes"
          rows={2}
          placeholder="Optional context for the attendees…"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
          className={`${inputClass} h-auto resize-y py-2`}
          {...form.register('notes')}
        />
      </Field>
    </div>
  )
}
