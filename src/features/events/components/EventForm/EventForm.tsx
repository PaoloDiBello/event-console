import * as Dialog from '@radix-ui/react-dialog'
import { CalendarPlus, X } from 'lucide-react'
import type { EventDraft, EventRecord } from '@/features/events/model'
import { EventFormFields } from './EventFormFields'
import { EventFormFooter } from './EventFormFooter'
import { useEventFormController } from './useEventFormController'

export interface EventFormProps {
  open: boolean
  mode: 'create' | 'edit'
  /** Present in edit mode; ignored when creating. */
  event?: EventRecord | null
  onOpenChange: (open: boolean) => void
  /** Resolve to close the dialog; reject to surface a save error inside the form. */
  onSubmit: (draft: EventDraft) => Promise<void> | void
  /** The control that opened the dialog: focus returns here on close. */
  returnFocusTo?: HTMLElement | null
}

export function EventForm({
  open,
  mode,
  event,
  onOpenChange,
  onSubmit,
  returnFocusTo,
}: EventFormProps) {
  const {
    form,
    isSaving,
    saveError,
    confirmDiscard,
    keepEditingRef,
    cancelRef,
    close,
    requestClose,
    submit,
    keepEditing,
  } = useEventFormController({ open, event, onOpenChange, onSubmit })

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className="dialog-content pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-[720px] overflow-y-auto rounded-lg border border-line-strong bg-surface shadow-2xl shadow-black/70"
            aria-describedby="event-form-description"
            onOpenAutoFocus={(event) => {
              // Skip the close button and land on the first real field.
              event.preventDefault()
              form.setFocus('title')
            }}
            onCloseAutoFocus={(event) => {
              // The opener is usually outside the dialog (a toolbar or row
              // button), so Radix's trigger heuristic cannot find it.
              if (!returnFocusTo?.isConnected) return
              event.preventDefault()
              returnFocusTo.focus({ preventScroll: true })
            }}
          >
            <div className="flex items-start gap-4 border-b border-line px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-sm border border-accent/30 bg-accent/10">
                <CalendarPlus aria-hidden="true" className="size-4 text-accent" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-sm font-semibold text-ink">
                  {mode === 'create' ? 'New event' : 'Edit event'}
                </Dialog.Title>
                <Dialog.Description id="event-form-description" className="mt-1 text-xs text-muted">
                  {mode === 'create'
                    ? 'Adds the event to the registry and to the agenda. Title and date are required.'
                    : 'Changes are applied to both the registry and the agenda.'}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="rounded-xs p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <form noValidate onSubmit={submit}>
              <EventFormFields form={form} />
              <EventFormFooter
                mode={mode}
                isSaving={isSaving}
                saveError={saveError}
                confirmDiscard={confirmDiscard}
                keepEditingRef={keepEditingRef}
                cancelRef={cancelRef}
                onCancel={requestClose}
                onKeepEditing={keepEditing}
                onDiscard={close}
              />
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
