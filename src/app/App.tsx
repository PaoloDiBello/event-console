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
    undoAction,
  } = useEventEditor()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
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
      <AppHeader onNewEvent={openCreate} onOpenShortcuts={() => setShortcutsOpen(true)} />

      <main className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-4">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/grid"
              element={<RegistryPage onEdit={openEdit} highlightedId={highlightedId} />}
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

      <AppToast message={success} action={undoAction} />
    </div>
  )
}
