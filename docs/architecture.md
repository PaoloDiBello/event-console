# Architecture

This app is small enough that a full framework (FSD, hexagonal, monorepo
packages) would add more ceremony than clarity. The structure below is the
smallest set of boundaries that keeps a 100,000-row data app, two views, a
modal editor, and three reusable components easy to change independently.

## Design criteria

Decisions were ranked by how much they affect day-to-day work:

1. **Change locality** — a change to the event domain or one view should stay in
   one folder. Registry and Agenda are lenses over the same event set, so they
   live under `features/events/` rather than as unrelated top-level features.
2. **Dependency direction** — the app shell depends on features; features depend
   on generic components and shared utilities. Generic components never import
   event types.
3. **Single responsibility per file** — split by concern (model, toolbar,
   rendering region, keyboard navigation, form fields), not by arbitrary line
   count.
4. **Explicit public boundaries** — each feature slice exposes a small
   `index.ts`; consumers import the boundary, not internal files.
5. **Low ceremony** — no dependency-injection container, no per-folder package,
   no state library beyond the existing Zustand store.
6. **Performance as a constraint** — the boundaries preserve the current design:
   filter/sort the full set outside TanStack, pass only one page to the table,
   virtualize rendered rows, and avoid module-level work in component files.

## Dependency direction

```
app  ──────────────► features/events ──────────► components/*
 │                         │                        │
 │                         └──────────► shared/lib ◄┘
 └──────────────────────────────────────► shared/lib
```

Arrows point at dependencies. The rules are:

- `app/` is the composition root. It may know routes, features, the editor
  chunk, and global keyboard shortcuts.
- `features/events/` owns the event model, store, editor, and both views.
  Registry and Agenda may import the event model/store and generic components.
- `components/` contains reusable, domain-free UI. `DataGrid` and `Timeline`
  know only about row/item types and callbacks.
- `shared/` contains pure utilities and test setup. It must not import features or
  components.
- No feature imports another feature's internal file. Cross-feature imports use
  the destination's `index.ts`.

## Directory map

```
src/
  app/                              composition root
    App.tsx                         routes, lazy chunks, global shortcuts
    components/
      AppHeader.tsx                 shell navigation and new-event action
      AppToast.tsx                  polite success live region
      RouteFallback.tsx             Suspense fallback
    hooks/
      useEventEditor.ts             editor state, submit, focus return, highlight

  features/events/                  the event feature slice
    model/                          pure domain
      types.ts                      EventRecord, labels, categories, tones
      generate.ts                   deterministic 100k dataset
      index.ts                      public model API
    store/                          state
      events.ts                     Zustand store, load/create/update
      index.ts                      public store API
    components/
      EventLabels.tsx               status/priority/category presentation
      EventForm/
        EventForm.tsx               dialog shell and submit orchestration
        EventFormFields.tsx         field grid
        EventFormFooter.tsx         actions, discard prompt, save error
        Field.tsx                   label/error/hint wrapper
        schema.ts                   Zod schema and time parsing
        formValues.ts               EventRecord -> form values
        styles.ts                   shared input/select classes
        index.ts                    public form API
    registry/                       "records" lens
      RegistryPage.tsx              data + DataGrid composition
      RegistryHeader.tsx            page header, stats, reload/error actions
      useRegistryStats.ts           one-pass header counters
      columns.tsx                   event columns and fast sort keys
      index.ts                      public page API
    agenda/                         "by day" lens
      AgendaPage.tsx                data + Timeline composition
      AgendaHeader.tsx              window, search, counts, key help
      AgendaEmptyState.tsx          query/window empty copy
      AgendaSkeleton.tsx            loading placeholder
      AgendaEventCard.tsx           one event's card content
      agendaData.ts                 windowing, grouping, sorting
      index.ts                      public page API

  components/                       reusable, domain-free
    DataGrid/
      DataGrid.tsx                  state, table, virtualizer, effects
      DataGridTable.tsx             table/colgroup composition
      DataGridHeader.tsx            sortable headers + filter row
      DataGridBody.tsx              skeleton/empty/virtual rows
      DataGridToolbar.tsx           toolbar composition
      DataGridSearch.tsx            global search control
      DataGridColumnMenu.tsx        visibility menu
      DataGridPagination.tsx        footer and navigation
      DataGridPageJump.tsx          typed page input
      DataGridEmpty.tsx             empty-state copy and reset actions
      DataGridError.tsx             error state
      DataGridSkeleton.tsx          loading rows
      model/                        pure filter/sort pipeline
        accessors.ts                column access and row shims
        filter.ts                   per-column and global filters
        sort.ts                     precomputed-key sorting
        buildRows.ts                full-set filter + sort
      types.ts / utils.ts / index.ts
    Timeline/
      Timeline.tsx                  virtualization and keyboard navigation
      TimelineRow.tsx               group and item rows
      timelineModel.ts              flatten/index rows
      types.ts / index.ts
    ui/
      PageHeader.tsx                generic page heading/actions layout

  shared/
    lib/                            cn, dates, formatting, keyboard
    test/setup.ts                   jsdom + Testing Library setup
```

## Why the event views are nested

Registry and Agenda are not separate domains. They are two representations of
one `EventRecord[]`, fed by one store. Keeping them under
`features/events/registry` and `features/events/agenda` makes that relationship
visible and prevents either view from growing its own copy of event types or
store logic. A future third lens (calendar, map) belongs alongside them, not in
a new top-level feature.

## Component split rules

Large components were split along state ownership, not visual size:

- **Orchestrator** (`DataGrid.tsx`, `Timeline.tsx`, `EventForm.tsx`,
  `RegistryPage.tsx`, `AgendaPage.tsx`) owns state, effects, and callbacks.
- **Presentational regions** (`DataGridTable`, `DataGridHeader`,
  `DataGridBody`, `TimelineRow`, `EventFormFields`, `EventFormFooter`) receive
  data and callbacks and render markup.
- **Pure model** (`model/*`, `timelineModel.ts`, `agendaData.ts`,
  `formValues.ts`, `schema.ts`) has no React imports where possible.
- **Small controls** (`DataGridSearch`, `DataGridColumnMenu`,
  `DataGridPageJump`) own only their local UI state.

This keeps the orchestrator readable while avoiding a forest of one-line
components. A file boundary exists where a unit has a distinct reason to change.

## Public APIs and imports

- `@/features/events/model` — event types, labels, generation.
- `@/features/events/store` — store hooks and `LoadStatus`.
- `@/features/events/components/EventForm` — `EventForm` and props.
- `@/features/events/registry` — `RegistryPage`.
- `@/features/events/agenda` — `AgendaPage`.
- `@/components/DataGrid` — `DataGrid`, column/props types.
- `@/components/Timeline` — `Timeline`, group/props types.
- `@/shared/lib/*` — pure utilities.
- `@/shared/lib/keyboard` — `isShortcutBlocked`, `hasCommandModifier`,
  `useGlobalKeydown`.

Inside `features/events/model`, files import sibling `./types` directly to avoid
a barrel cycle. Consumers outside the model import the barrel.

## Data flow

```
generateEvents()
      │
      ▼
Zustand store (events, status, error)
      │
      ├──► RegistryPage ──► DataGrid
      │                       │ buildRows(full set) = filter + sort
      │                       │ page slice ──► TanStack Table
      │                       └─ virtualized page rows
      │
      ├──► AgendaPage ──► buildTimeline(window, query) ──► Timeline
      │                                                   └─ virtualized flat rows
      │
      └──► useEventEditor ──► EventForm ──► create/update store
```

The store is the only shared mutable state. Views derive their data; the editor
writes through the store so both views update without synchronization code.

## Global keyboard shortcuts

`shared/lib/keyboard.ts` centralizes the rule for when single-key shortcuts are
allowed. It blocks fields, dialogs, menus, and listboxes, and ignores modifier
keys. `App` (`n`), `AppHeader` (`g`/`t`), and `DataGrid` (`/`) all use the same
helper, so the guard cannot drift between features.

## Testing

Tests are colocated with the unit they exercise:

- `features/events/model/generate.test.ts` — deterministic dataset shape.
- `features/events/store/events.test.ts` — load/error/create/update.
- `features/events/components/EventForm/schema.test.ts` — validation.
- `features/events/components/EventForm/EventForm.test.tsx` — focus, errors,
  discard flow.
- `features/events/agenda/agendaData.test.ts` — windowing, grouping, search.
- `components/DataGrid/DataGrid.test.tsx` — sorting, filtering, pagination,
  page jump, focus reveal.
- `components/Timeline/Timeline.test.tsx` — navigation and announcements.

The suite is behavior-focused. Pure model helpers are covered through their
public components and page data tests; add unit tests when a helper grows logic
that is awkward to observe through the UI.

## Evolution rules

- Put a new reusable, domain-free widget in `components/`. If it needs
  `EventRecord`, it belongs in `features/events/components/`.
- Put a new event view under `features/events/<view>/` and expose only its page
  through `index.ts`.
- Keep filter/sort/virtualization decisions in the orchestrator or model, not in
  presentational rows.
- Add a shared helper to `shared/lib` only when at least two callers need the same
  policy (as with keyboard guards).
- Prefer extending an existing public boundary over adding a new global barrel.
