import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from '@/app/components/AppHeader'
import { AppToast } from '@/app/components/AppToast'
import { RouteFallback } from '@/app/components/RouteFallback'
import { ShortcutsDialog } from '@/app/components/ShortcutsDialog'
import { useEventEditor } from '@/app/hooks/useEventEditor'
import type { EventRecord } from '@/features/events/model'
import { useEventStore } from '@/features/events/store'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
import { useTransientValue } from '@/shared/hooks/useTransientValue'
import { useVisualViewport } from '@/shared/hooks/useVisualViewport'
import { hasCommandModifier, isShortcutBlocked } from '@/shared/lib/keyboard'

// Routes and the editor are split out so the initial shell does not download
// the table, the timeline and the form stack before it can paint.
const RegistryPage = lazy(() =>
  import('@/features/events/registry').then((module) => ({ default: module.RegistryPage })),
)
const AgendaPage = lazy(() =>
  import('@/features/events/agenda').then((module) => ({ default: module.AgendaPage })),
)
const EventForm = lazy(() =>
  import('@/features/events/components/EventForm').then((module) => ({
    default: module.EventForm,
  })),
)

/** Distinct owners or locations already in the registry, sorted for the form. */
function distinctValues(events: readonly EventRecord[], key: 'owner' | 'location'): string[] {
  const values = new Set<string>()
  for (const event of events) values.add(event[key])
  return [...values].sort((a, b) => a.localeCompare(b))
}

export function App() {
  const load = useEventStore((state) => state.load)
  const events = useEventStore((state) => state.events)
  const ownerSuggestions = useMemo(() => distinctValues(events, 'owner'), [events])
  const locationSuggestions = useMemo(() => distinctValues(events, 'location'), [events])
  /**
   * True while the pointer or keyboard focus rests on the toast. The two
   * confirmation clocks stop for that time so Undo cannot disappear under the
   * cursor, and a page notice shares the setting with the editor's success.
   */
  const [toastPaused, setToastPaused] = useState(false)
  const {
    editor,
    editorMounted,
    success,
    highlightedId,
    opener,
    openCreate,
    openEdit,
    closeEditor,
    handleSubmit,
    handleDelete,
    handleBulkDelete,
    dismissSuccess,
    undoAction,
  } = useEventEditor(toastPaused)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  /** Page-level confirmations (an export, say) share the one toast. */
  const [notice, setNotice] = useTransientValue<string>(5000, { paused: toastPaused })
  // Keeps the phone sheet sized to the visible area when the keyboard opens.
  useVisualViewport()

  useEffect(() => {
    void load()
  }, [load])

  // "?" is the conventional help key; it never fires from a field or an overlay.
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (event.key !== '?' || isShortcutBlocked(event.target)) return
    event.preventDefault()
    setShortcutsOpen(true)
  })

  // "n" opens the create form from anywhere outside a text field or overlay.
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (event.key.toLowerCase() !== 'n' || isShortcutBlocked(event.target)) return
    event.preventDefault()
    openCreate()
  })

  return (
    <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
      {/* The header carries the brand, the lens switch and three actions; the
          table is below all of it. One keypress should be able to skip that. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-sm focus:border focus:border-accent/60 focus:bg-raised focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:outline-none"
      >
        Skip to content
      </a>
      <AppHeader onNewEvent={openCreate} onOpenShortcuts={() => setShortcutsOpen(true)} />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-3 py-4 focus:outline-none sm:px-4"
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/grid"
              element={
                <RegistryPage
                  onEdit={openEdit}
                  onBulkDelete={handleBulkDelete}
                  highlightedId={highlightedId}
                  onNotify={setNotice}
                />
              }
            />
            <Route path="/timeline" element={<AgendaPage onEdit={openEdit} />} />
            <Route path="*" element={<Navigate to="/grid" replace />} />
          </Routes>
        </Suspense>
      </main>

      {editorMounted ? (
        <Suspense fallback={null}>
          <EventForm
            open={editor !== null}
            mode={editor?.mode ?? 'create'}
            event={editor?.mode === 'edit' ? editor.event : null}
            returnFocusTo={opener}
            onOpenChange={(open) => {
              if (!open) closeEditor()
            }}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            ownerSuggestions={ownerSuggestions}
            locationSuggestions={locationSuggestions}
          />
        </Suspense>
      ) : null}

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      <AppToast
        // The editor's confirmation owns the toast: it may carry Undo, and a
        // page notice that pushed it aside would take that action with it.
        // Notices fill the gap when nothing was just changed.
        message={success ?? notice}
        action={undoAction}
        onPausedChange={setToastPaused}
        onDismiss={() => {
          setNotice(null)
          dismissSuccess()
        }}
      />
    </div>
  )
}
