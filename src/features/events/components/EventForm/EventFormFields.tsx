import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import { SelectMenu } from '@/components/ui/SelectMenu'
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
import { inputClass } from './styles'
import { SuggestionField } from './SuggestionField'

interface EventFormFieldsProps {
  form: UseFormReturn<EventFormValues>
  /** Values already in the registry, offered while typing owner/location. */
  ownerSuggestions?: readonly string[]
  locationSuggestions?: readonly string[]
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
 * The form's four choice fields. Labels are the same strings the grid's select
 * filters show, so a status reads identically in both views.
 */
const DURATION_CHOICES = DURATION_OPTIONS.map((minutes) => ({
  value: minutes,
  label: `${minutes} minutes`,
}))
const CATEGORY_CHOICES = EVENT_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))
const STATUS_CHOICES = EVENT_STATUSES.map((value) => ({ value, label: STATUS_LABEL[value] }))
const PRIORITY_CHOICES = EVENT_PRIORITIES.map((value) => ({ value, label: PRIORITY_LABEL[value] }))

export function EventFormFields({
  form,
  ownerSuggestions = [],
  locationSuggestions = [],
}: EventFormFieldsProps) {
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
            <SelectMenu
              id="durationMin"
              label="Duration"
              value={field.value}
              options={DURATION_CHOICES}
              onValueChange={field.onChange}
              triggerRef={field.ref}
              onBlur={field.onBlur}
              triggerClassName={inputClass}
              hasError={Boolean(errors.durationMin)}
              describedBy={errors.durationMin ? 'durationMin-error' : undefined}
            />
          )}
        />
      </Field>

      <Field label="Category" htmlFor="category" error={errors.category?.message}>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SelectMenu
              id="category"
              label="Category"
              value={field.value}
              options={CATEGORY_CHOICES}
              onValueChange={field.onChange}
              triggerRef={field.ref}
              onBlur={field.onBlur}
              triggerClassName={inputClass}
              hasError={Boolean(errors.category)}
              describedBy={errors.category ? 'category-error' : undefined}
            />
          )}
        />
      </Field>

      <Field label="Status" htmlFor="status" error={errors.status?.message}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectMenu
              id="status"
              label="Status"
              value={field.value}
              options={STATUS_CHOICES}
              onValueChange={field.onChange}
              triggerRef={field.ref}
              onBlur={field.onBlur}
              triggerClassName={inputClass}
              hasError={Boolean(errors.status)}
              describedBy={errors.status ? 'status-error' : undefined}
            />
          )}
        />
      </Field>

      <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <SelectMenu
              id="priority"
              label="Priority"
              value={field.value}
              options={PRIORITY_CHOICES}
              onValueChange={field.onChange}
              triggerRef={field.ref}
              onBlur={field.onBlur}
              triggerClassName={inputClass}
              hasError={Boolean(errors.priority)}
              describedBy={errors.priority ? 'priority-error' : undefined}
            />
          )}
        />
      </Field>

      <Field label="Owner" htmlFor="owner" error={errors.owner?.message}>
        <Controller
          control={control}
          name="owner"
          render={({ field }) => (
            <SuggestionField
              id="owner"
              label="Owner"
              field={field}
              suggestions={ownerSuggestions}
              placeholder="Unassigned"
              autoComplete="name"
              hasError={Boolean(errors.owner)}
            />
          )}
        />
      </Field>

      <Field label="Location" htmlFor="location" error={errors.location?.message}>
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <SuggestionField
              id="location"
              label="Location"
              field={field}
              suggestions={locationSuggestions}
              placeholder="Remote"
              hasError={Boolean(errors.location)}
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
