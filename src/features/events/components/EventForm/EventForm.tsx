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
  /** Edit mode only: the event was deleted after confirmation. */
  onDelete?: (event: EventRecord) => void
  /** The control that opened the dialog: focus returns here on close. */
  returnFocusTo?: HTMLElement | null
  /** Owners and locations already in the registry, suggested while typing. */
  ownerSuggestions?: readonly string[]
  locationSuggestions?: readonly string[]
}

export function EventForm({
  open,
  mode,
  event,
  onOpenChange,
  onSubmit,
  onDelete,
  returnFocusTo,
  ownerSuggestions,
  locationSuggestions,
}: EventFormProps) {
  const {
    form,
    isSaving,
    saveError,
    confirmDiscard,
    confirmingDelete,
    keepEditingRef,
    cancelRef,
    deleteRef,
    cancelDeleteRef,
    close,
    requestClose,
    submit,
    keepEditing,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useEventFormController({ open, event, onOpenChange, onSubmit, onDelete })

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/65 backdrop-blur-[3px]" />
        {/* Phones get a bottom sheet: full width, hugging the bottom edge, so
            the pinned footer lands in the thumb zone instead of mid-screen.
            It is sized to the visual viewport, not the layout viewport, so the
            keyboard pushing the visible area up takes the footer with it
            instead of burying it; the side insets keep it clear of a notch in
            landscape. Both fall back to the old behaviour when unavailable. */}
        <div className="pointer-events-none fixed top-[var(--vv-offset-top,0px)] right-[env(safe-area-inset-right)] left-[env(safe-area-inset-left)] z-50 flex h-[var(--vv-height,100dvh)] items-end justify-center p-0 sm:items-center sm:p-4">
          <Dialog.Content
            className="dialog-content pointer-events-auto flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-t-xl border border-line-strong bg-surface shadow-2xl shadow-black/70 sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg"
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
            <div className="flex shrink-0 items-start gap-4 border-b border-line px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
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

            <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              {/* Only the fields scroll; the footer stays reachable on short screens. */}
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                <EventFormFields
                  form={form}
                  ownerSuggestions={ownerSuggestions}
                  locationSuggestions={locationSuggestions}
                />
              </div>
              <EventFormFooter
                mode={mode}
                isSaving={isSaving}
                saveError={saveError}
                confirmDiscard={confirmDiscard}
                confirmingDelete={confirmingDelete}
                keepEditingRef={keepEditingRef}
                cancelRef={cancelRef}
                deleteRef={deleteRef}
                cancelDeleteRef={cancelDeleteRef}
                onCancel={requestClose}
                onKeepEditing={keepEditing}
                onDiscard={close}
                onRequestDelete={requestDelete}
                onCancelDelete={cancelDelete}
                onConfirmDelete={confirmDelete}
              />
            </form>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
