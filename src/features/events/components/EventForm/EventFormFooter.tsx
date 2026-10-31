import { AlertTriangle, Loader2, Save } from 'lucide-react'
import type { RefObject } from 'react'

interface EventFormFooterProps {
  mode: 'create' | 'edit'
  isSaving: boolean
  saveError: string | null
  confirmDiscard: boolean
  keepEditingRef: RefObject<HTMLButtonElement | null>
  cancelRef: RefObject<HTMLButtonElement | null>
  onCancel: () => void
  onKeepEditing: () => void
  onDiscard: () => void
}

export function EventFormFooter({
  mode,
  isSaving,
  saveError,
  confirmDiscard,
  keepEditingRef,
  cancelRef,
  onCancel,
  onKeepEditing,
  onDiscard,
}: EventFormFooterProps) {
  return (
    <div className="border-t border-line bg-raised/40 px-5 py-3">
      {saveError ? (
        <p
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-sm border border-rose/25 bg-rose/10 px-2.5 py-2 text-[11px] text-rose"
        >
          <AlertTriangle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {saveError}
        </p>
      ) : null}

      {confirmDiscard ? (
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-amber/25 bg-amber/[0.07] px-2.5 py-2">
          <p className="mr-auto text-[11px] text-amber">Discard your unsaved changes?</p>
          <button
            type="button"
            ref={keepEditingRef}
            onClick={onKeepEditing}
            className="h-8 rounded-xs border border-line bg-canvas px-3 text-[11px] font-medium text-ink hover:border-line-strong"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="h-8 rounded-xs border border-rose/30 bg-rose/10 px-3 text-[11px] font-medium text-rose hover:bg-rose/15"
          >
            Discard changes
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            ref={cancelRef}
            onClick={onCancel}
            disabled={isSaving}
            className="h-9 rounded-sm border border-line bg-canvas px-4 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent/40 bg-accent/15 px-4 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-3.5" />
            )}
            {isSaving ? 'Saving…' : mode === 'create' ? 'Create event' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}
