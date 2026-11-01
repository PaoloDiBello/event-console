import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppHeader } from '@/app/components/AppHeader'
import { AppToast } from '@/app/components/AppToast'
import { RouteFallback } from '@/app/components/RouteFallback'
import { useEventEditor } from '@/app/hooks/useEventEditor'
import { useEventStore } from '@/features/events/store'
import { useGlobalKeydown } from '@/shared/hooks/useGlobalKeydown'
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

export function App() {
  const load = useEventStore((state) => state.load)
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
  } = useEventEditor()

  useEffect(() => {
    void load()
  }, [load])

  // "n" opens the create form from anywhere outside a text field or overlay.
  useGlobalKeydown((event) => {
    if (event.defaultPrevented || event.repeat || hasCommandModifier(event)) return
    if (event.key.toLowerCase() !== 'n' || isShortcutBlocked(event.target)) return
    event.preventDefault()
    openCreate()
  })

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader onNewEvent={openCreate} />

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
          />
        </Suspense>
      ) : null}

      <AppToast message={success} />
    </div>
  )
}
