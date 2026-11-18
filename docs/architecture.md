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
 │                         └──────────► shared ◄────┘
 └─────────────────────────────────────► shared
```

Arrows point at dependencies. The rules are:

- `app/` is the composition root. It may know routes, features, the editor
  chunk, and global keyboard shortcuts.
- `features/events/` owns the event model, store, editor, and both views.
  Registry and Agenda may import the event model/store and generic components.
- `components/` contains reusable, domain-free UI. `DataGrid` and `Timeline`
  know only about row/item types and callbacks.
- `shared/` contains pure utilities, reusable hooks, and test setup. It must not
  import features or components.
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
      ShortcutsDialog.tsx           keyboard cheatsheet dialog
    hooks/
      useEventEditor.ts             editor state, submit, focus return, highlight

  features/events/                  the event feature slice
    model/                          pure domain
      types.ts                      EventRecord, labels, categories, tones
      generate.ts                   deterministic 100k dataset
      search.ts                     the single global-search haystack builder
      index.ts                      public model API
    store/                          state
      events.ts                     Zustand store, load/create/update
      useEventFeed.ts               feed hook: events/status/error/loading/reload
      index.ts                      public store API
    components/
      EventLabels.tsx               status/priority/category presentation
      EventForm/
        EventForm.tsx               dialog shell
        useEventFormController.ts   form state, submit, discard and focus flow
        EventFormFields.tsx         field grid
        EventFormFooter.tsx         actions, discard prompt, save error
        Field.tsx                   label/error/hint wrapper
        schema.ts                   Zod schema and time parsing
        formValues.ts               EventRecord <-> form values / EventDraft
        styles.ts                   shared input classes
        index.ts                    public form API
    registry/                       "records" lens
      RegistryPage.tsx              data + DataGrid composition, URL-backed view, selection owner
      RegistryHeader.tsx            page header, quick-filter stats, actions
      BulkActionBar.tsx             floating selection pill: count, clear, delete
      BulkDeleteDialog.tsx          confirmation with an event preview and focus return
      DensityMenu.tsx               named row-density menu
      density.ts                    density values and row heights
      registryView.ts               shareable view <-> URL (read, validate, write)
      useRegistryStats.ts           one-pass header counters
      columns.tsx                   event columns and fast sort keys
      EventPrimaryCell.tsx          the row's title cell, wide and narrow shapes
      index.ts                      public page API
    agenda/                         "by day" lens
      AgendaPage.tsx                data + Timeline composition, URL-backed view
      agendaView.ts                 shareable view <-> URL (read, validate, write)
      AgendaHeader.tsx              page header and window stats
      AgendaToolbar.tsx             panel toolbar: search, window, jump, today
      AgendaDatePicker.tsx          jump-to-date popover and calendar
      AgendaFooter.tsx              panel footer: counts and key help
      AgendaEmptyState.tsx          query/window empty copy
      AgendaError.tsx               load-failure panel with retry
      AgendaSkeleton.tsx            loading placeholder
      AgendaEventCard.tsx           one event's card content
      agendaData.ts                 windowing, grouping, sorting
      index.ts                      public page API

  components/                       reusable, domain-free
    DataGrid/
      DataGrid.tsx                  composition: controller + virtualizer + reveal + selection slot
      hooks/
        useDataGridController.ts    search, sort, filters, pagination, table, selection
        useRowReveal.ts             jump to a row's page and scroll it into view
        useGridScrollReset.ts       top-of-list reset on view changes
        useScrollEdges.ts           which horizontal edges still hide content
        useDataGridShortcuts.ts     "/" focuses search, "f" the first filter
      DataGridTable.tsx             table/colgroup composition
      DataGridHeader.tsx            sortable headers (one roving tab stop) + filter row
      DataGridColumnFilter.tsx      one filter-row control
      DataGridSelectFilter.tsx      multi-select facet: checkbox menu + row counts
      DataGridDateFilter.tsx        date filter trigger + shared calendar
      DataGridFilterClear.tsx       inline clear affordance
      filterControlStyles.ts        idle/active/focus control classes
      DataGridBody.tsx              skeleton/empty/virtual rows + row keyboard model
      DataGridToolbar.tsx           toolbar composition
      DataGridSearch.tsx            global search control
      DataGridFilterPanel.tsx       phone filter sheet over the same controls
      DataGridColumnMenu.tsx        visibility menu
      DataGridPagination.tsx        footer and navigation
      DataGridPageJump.tsx          typed page input
      DataGridPageSize.tsx          rows-per-page menu
      DataGridEmpty.tsx             empty-state copy and reset actions
      DataGridError.tsx             load-failure copy over ErrorState
      DataGridScrollFade.tsx        gradient cue on a clipped edge
      DataGridSkeleton.tsx          loading rows
      layoutContext.ts              wide/narrow row layout published once per grid
      pinnedColumn.ts               frozen first column (pinned at every width)
      model/                        pure filter/sort pipeline
        accessors.ts                column access and row shims
        filter.ts                   per-column and global filters
        facets.ts                   per-option counts for the open menu
        sort.ts                     precomputed-key sorting
        buildRows.ts                full-set filter + sort
      types.ts / utils.ts / index.ts
    Timeline/
      Timeline.tsx                  composition: model + virtualizer + focus hooks
      hooks/
        useTimelineModel.ts         flatten and index rows
        useTimelineFocus.ts         roving tabindex and pending focus
        useTimelineKeyboard.ts      arrow/Home/End/Enter navigation
        useTimelineAnnouncement.ts  polite live-region copy
      TimelineRow.tsx               group and item rows
      timelineModel.ts              flatten/index row types and helpers
      types.ts / index.ts
    ui/
      PageHeader.tsx                generic page heading/actions layout
      EmptyState.tsx                shared empty-state layout
      ErrorState.tsx                shared load-failure layout with retry
      SelectMenu.tsx                one select control backed by the app menu
      Checkbox.tsx                  native checkbox in the console palette, mixed state
      Kbd.tsx                       keyboard hint chip
      Button.tsx                    one button component
      buttonStyles.ts               variant/size classes for triggers and refs
      SearchField.tsx               one search control for both views
      Stat.tsx                      one metric card for both headers
      surfaces.ts                   panel/toolbar/footer/segment classes

  shared/
    hooks/                          reusable React hooks
      useGlobalKeydown.ts           global shortcut subscription
      useTransientValue.ts          value that clears itself after N ms
      usePersistentState.ts         validated preference kept in localStorage
    lib/                            cn, dates, formatting, keyboard guards
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

- **Composition** (`DataGrid.tsx`, `Timeline.tsx`, `EventForm.tsx`) wires
  controller hooks to presentational regions. It should read like a layout, not
  a state machine.
- **Controller hooks** (`useDataGridController`, `useTimelineFocus`,
  `useTimelineKeyboard`, `useEventFormController`, `useEventFeed`) own state,
  effects, and callbacks. They are the only place a view's rules live.
- **Presentational regions** (`DataGridTable`, `DataGridHeader`,
  `DataGridBody`, `DataGridColumnFilter`, `TimelineRow`, `EventFormFields`,
  `EventFormFooter`, `EmptyState`) receive data and callbacks and render markup.
- **Pure model** (`model/*`, `timelineModel.ts`, `agendaData.ts`,
  `formValues.ts`, `schema.ts`, `search.ts`) has no React imports where
  possible.
- **Small controls** (`DataGridSearch`, `DataGridColumnMenu`,
  `DataGridPageJump`) own only their local UI state.

This keeps the composition readable while avoiding a forest of one-line
components. A file boundary exists where a unit has a distinct reason to change.

## Shareable view state

The registry's applied view — query, column filters, sort, page, page size — is
the unit worth sharing. `features/events/registry/registryView.ts` is the only
module that knows the registry's URL vocabulary. It validates every value against
the filterable columns and the domain enums before returning state, and omits the
default view so `/grid` stays canonical.

A facet column can hold several values, so it repeats its parameter
(`?category=meeting&category=deploy`). Each token is validated and de-duplicated
on read and dropped on write if a control could not produce it; a single value
still reads back as a one-item list, so filter state has one shape regardless of
how many values were chosen.

The agenda has the same contract in `features/events/agenda/agendaView.ts`:
query, window, at-risk filter and focused day. Both modules use `q` for search
because it means the same thing in both lenses, which is why switching views
keeps it. A shared `day` outside the chosen window widens the window instead of
being dropped, so a link never points at a day the user cannot see.

`DataGrid` remains uncontrolled by default. `RegistryPage` passes `columnFilters`
plus `onColumnFiltersChange` only because the At-risk metric must set a filter
from outside the grid; `onViewStateChange` mirrors search/sort/paging. Both pages
write with `replace`, so filtering never fills the history stack, and an external
URL change (nav click, Back) re-seeds the view — the grid through a remount key,
the agenda by adopting the link and jumping to its day.

## Bulk selection

Selection belongs to `RegistryPage`, not to `DataGrid`: a bulk delete has to
uncheck the boxes after it runs, and a grid that owns its own selection can only
hide the action bar. The grid accepts optional `selectedRowIds` /
`onSelectionChange`; omit them and it stays uncontrolled for any other caller.

`DataGrid` exposes a `selectionBar` slot inside its scroll wrapper. The bar is
positioned above the footer instead of taking a row in the layout, so selecting a
row never resizes the table under the pointer, and it cannot cover the
pagination at narrow widths.

The header checkbox can only reach the current page, so the grid also publishes
the rows the applied search and filters left through `filteredRowsRef`. Once a
full page is selected, `BulkActionBar` offers “Select all N matching”, and
`RegistryPage` takes those ids instead of filtering 100k rows a second time. The
offer is conditional on a full page (`count >= min(pageSize, matching)`), so it
never appears beside a single tick, and it disappears once the whole match is
selected. The confirmation can then say how much of the selection is off-screen,
which is the number that matters when the action is irreversible apart from Undo.

The delete confirmation previews up to five selected events and counts the rest.
A count alone is easy to trust and hard to verify, especially because selection
survives paging and filtering. `BulkDeleteDialog` remembers the control that
opened it (the bar's Delete button) and returns focus there on close, since the
dialog is opened by state rather than by a Radix trigger.

Both single and bulk delete write through `useEventEditor`'s one undo slot, so
the toast, the Undo affordance and the restore semantics cannot drift. Bulk undo
restores the records without moving the grid: the point is putting the data
back, not jumping the reader to an arbitrary page.

## One visual system

Registry and agenda are two lenses on the same data, so they share one shell:
`PageHeader` (title, description, metric cards, actions), then a panel with a
toolbar, a scrolling body and a status footer.

- `components/ui/buttonStyles.ts` is the only source of button classes.
  `Button` uses it; Radix triggers and buttons that need a ref call
  `buttonClass()` directly.
- `SearchField` is the only search control, so icon, height, clear affordance
  and focus ring cannot drift between views. It also owns the Escape contract
  for every search box: clear when there is a value, blur when there is not, and
  a caller's `onKeyDown` runs first so a view can still prevent it.
- `ErrorState` is the only load-failure panel. The grid titles it “Could not
  load rows”, the agenda “Could not load events”, and both pass the feed's
  `reload` as the same **Retry** — so a failed load cannot leave one view with a
  retryable error and the other with a stale or empty body.
- `SelectMenu` is the only select control: an in-app radio menu on the raised
  surface, the trigger named by the field label, and the menu matched to the
  trigger's width. The form's four choice fields use it; the grid's select
  filters share the same menu treatment. No control hands the keyboard to the
  operating-system `<select>` popup.
- The grid pins its first rendered column at every width (`pinnedColumn.ts`).
  In the registry that is the 32 px selection gutter, so the checkboxes stay
  reachable while the data columns scroll under them; a grid whose first column
  is the title keeps the title still instead. Because the left edge is always
  occupied, only the right edge fades.
- Responsive layout is split between CSS and `shared/hooks/useMediaQuery`:
  spacing and visibility that CSS can express stay in classes, while the
  decisions that change what is rendered — dropping `meta.hideBelow` columns,
  replacing the filter row with `DataGridFilterPanel` below `md`, and telling
  cells which row shape they are painting — are read in JS so the header, body,
  skeleton and `colgroup` are filtered from one list. Without `matchMedia` the
  hook reports the wide layout, so tests and older browsers get the desktop
  surface.
- The narrow decision is published once through `GridLayoutContext` rather than
  re-read by every cell: fifty rows should not mean fifty `matchMedia`
  subscriptions, and a cell that swapped markup on its own would put the same
  fact in the DOM twice. `EventPrimaryCell` reads it to choose between the wide
  title/id line and the two-line phone card that carries the day, time, status
  and priority the hidden columns no longer show. The same flag tells the table
  to leave non-compact columns at `auto` width, so the phone table cannot end up
  two pixels wider than its viewport, and forces a 52 px row height, because the
  two-line card would be clipped by a compact desktop density.
- `Stat` is the only metric card. Both headers show two of them at the same
  height as the adjacent buttons.
- `components/ui/surfaces.ts` owns `panelClass`, `toolbarClass`, `footerClass`
  and the segmented-control classes, which is why the header's Registry/Agenda
  lens and the agenda's 7/30/45-day window select with the same accent capsule.
  `DataGrid`, `Timeline`, `AgendaSkeleton` and `RouteFallback` all use
  `panelClass`.
- `Timeline` accepts `toolbar` and `footer` slots, which is how the agenda gets
  the same anatomy as the grid without duplicating panel markup.

Scale: panels are `rounded-lg`, cards and dense controls `rounded-sm`/`rounded-xs`,
page buttons are `h-9`, compact buttons `h-8`, icon buttons `size-9`/`size-8`.

## Public APIs and imports

- `@/features/events/model` — event types, labels, generation, search text.
- `@/features/events/store` — store hooks, `useEventFeed`, and `LoadStatus`.
- `@/features/events/components/EventForm` — `EventForm` and props.
- `@/features/events/registry` — `RegistryPage`.
- `@/features/events/agenda` — `AgendaPage`.
- `@/components/DataGrid` — `DataGrid`, column/props types.
- `@/components/Timeline` — `Timeline`, group/props types.
- `@/shared/lib/*` — pure utilities.
- `@/shared/lib/keyboard` — `isShortcutBlocked`, `hasCommandModifier`.
- `@/shared/hooks/useGlobalKeydown` — global shortcut subscription.
- `@/shared/hooks/useTransientValue` — auto-clearing toast/highlight state.
- `@/shared/hooks/usePersistentState` — a display preference that survives a
  reload. View state (search, filters, sort, page) stays in the URL so it can be
  shared and undone with Back; only taste that no link should carry — row
  density, column visibility — is stored, and it is validated on read because a
  stale value must not reach the virtualizer.

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
keys. `shared/hooks/useGlobalKeydown.ts` owns the listener lifecycle. `App` (`n`,
`?`), `AppHeader` (`g`/`t`), and `DataGrid` (`/`) all use the same helper, so the
guard cannot drift between features.

`?` opens `ShortcutsDialog`, which is the single discoverable list of every
shortcut grouped by context. The dialog is also reachable from the header, so
the cheatsheet is not itself a hidden shortcut. Because the guard includes
`[role="dialog"]`, the panel cannot be re-opened from inside itself and Escape
closes it like every other overlay.

## Testing

Tests are colocated with the unit they exercise:

- `features/events/model/generate.test.ts` — deterministic dataset shape.
- `features/events/model/search.test.ts` — the global-search haystack.
- `features/events/store/events.test.ts` — load/error/create/update.
- `features/events/components/EventForm/schema.test.ts` — validation.
- `features/events/components/EventForm/formValues.test.ts` — draft mapping.
- `features/events/components/EventForm/EventForm.test.tsx` — focus, errors,
  menu-picked values, discard flow.
- `features/events/agenda/agendaData.test.ts` — windowing, grouping, search.
- `features/events/agenda/agendaView.test.ts` — agenda URL round-tripping,
  window/day validation and widening.
- `features/events/agenda/AgendaDatePicker.test.tsx` — jump calendar.
- `features/events/agenda/AgendaPage.test.tsx` — a failed load replaces the
  timeline with a retryable error instead of a stale or empty one.
- `features/events/registry/registryView.test.ts` — URL view round-tripping
  and validation.
- `features/events/registry/RegistryHeader.test.tsx` — quick-filter stats.
- `features/events/registry/columns.test.tsx` — column labels and sort keys.
- `features/events/registry/BulkDeleteDialog.test.tsx` — count-aware copy,
  preview cap, cancel/confirm, initial focus.
- `features/events/registry/BulkActionBar.test.tsx` — the select-all-matching
  prompt, when it appears and disappears, and formatted counts.
- `features/events/registry/EventPrimaryCell.test.tsx` — the narrow card carries
  the facts its hidden columns used to, and the wide line keeps the id.
- `features/events/registry/DensityMenu.test.tsx` — full density labels and the
  selected option.
- `app/hooks/useEventEditor.test.ts` — bulk delete through the shared toast and
  undo path.
- `components/DataGrid/DataGrid.test.tsx` — sorting, filtering, pagination,
  page jump, focus reveal, controlled selection, the published filtered rows and
  selection summary, the roving header tab stop, `meta.width` sizing, and the
  phone filter sheet.
- `shared/hooks/useMediaQuery.test.ts` — the width query, its change events and
  the wide-layout fallback.
- `components/DataGrid/DataGridDateFilter.test.tsx` — date filter menu.
- `components/DataGrid/hooks/useScrollEdges.test.ts` — clipped-edge detection.
- `components/Timeline/Timeline.test.tsx` — navigation and announcements.
- `app/components/ShortcutsDialog.test.tsx` — cheatsheet groups and Escape close.
- `shared/hooks/useDebouncedValue.test.ts` — the search debounce hook.
- `shared/hooks/useVisualViewport.test.ts` — the phone keyboard hook.
- `components/ui/Kbd.test.tsx` — keyboard hint chip.
- `components/ui/SelectMenu.test.tsx` — menu selection, Escape, error wiring.
- `components/ui/SearchField.test.tsx` — the shared Escape clear/blur contract.

The suite is behavior-focused. Pure model helpers are covered through their
public components and page data tests; add unit tests when a helper grows logic
that is awkward to observe through the UI.

## Evolution rules

- Put a new reusable, domain-free widget in `components/`. If it needs
  `EventRecord`, it belongs in `features/events/components/`.
- Put a new event view under `features/events/<view>/` and expose only its page
  through `index.ts`.
- Put stateful view logic in a controller hook under the component's `hooks/`
  folder; keep the view itself about composition.
- Keep filter/sort/virtualization decisions in the controller/model, not in
  presentational rows.
- Add a shared hook to `shared/hooks` only when at least two callers need the
  same lifecycle policy (as with `useTransientValue`).
- Prefer extending an existing public boundary over adding a new global barrel.
