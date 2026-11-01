# Assignment audit

A requirement-by-requirement check of the brief against the current app. The
goal is to keep this file short enough to be useful in review, not to duplicate
the README.

## DataGrid

| Requirement | Where |
| --- | --- |
| Client-side pagination | `DataGrid` page slice + `DataGridPagination` / `DataGridPageJump` |
| Client-side sorting | `model/buildRows.ts` → `model/sort.ts` (precomputed sort keys) |
| Column filtering | filter row in `DataGridHeader`; `model/filter.ts` |
| Loading state | `DataGridSkeleton` via `DataGridBody` |
| Empty state | `DataGridEmpty` (no data, no match, no search/filter match) |
| Error state | `DataGridError` + “Simulate error” in `RegistryHeader` |
| Hide/show columns | `DataGridColumnMenu`, `initialColumnVisibility` |
| Column label | `header` on the TanStack `ColumnDef` |
| Column accessor | `accessorKey` / `accessorFn` on the `ColumnDef` |

## Timeline

| Requirement | Where |
| --- | --- |
| Grouped by day | `features/events/agenda/agendaData.ts` groups on the ISO day; rationale in `Timeline.tsx` and the README |
| Left / Right | first event of the previous / next day |
| Up / Down | previous / next event, crossing day boundaries in reading order |
| Screen-reader announcements | polite live region updated on every focus move with day + “n of m” |

## Form

| Requirement | Where |
| --- | --- |
| Controlled inputs | every field uses React Hook Form `Controller` |
| Required title | Zod `eventFormSchema` |
| Valid date | Zod + `isRealIsoDay` (rejects impossible days such as 2026-02-31) |
| Validation messages | `Field` renders `role="alert"` errors |
| Focus first invalid field | `shouldFocusError: true`; covered by `EventForm.test.tsx` |
| Cancel / save flow | Cancel, dirty-state discard confirmation, save error region |
| Success message region | `AppToast`, an always-mounted polite live region |

## Demo app

- Two routes: `/grid` and `/timeline`, both fed by one Zustand event store.
- “New event” opens the modal editor; save writes through the store, so the
  grid and timeline update without synchronization code.
- 100,000 generated events; the timeline’s default 45-day window contains
  10,400 of them. Both numbers exceed the brief’s minimum.
- Mock data only, deterministic seed, intentional mock latency so loading and
  error states are visible.

## Deliverables

- Public repository: `github.com/PaoloDiBello/event-console`.
- Commit history separates scaffold, data/store, components, demo, and polish.
- `npm test` (44 tests), `npm run build`, and `npm run lint` pass.

## Judgment calls worth knowing

1. The success confirmation is a global toast, not markup inside the dialog,
   because the dialog closes on save and the toast is the only place the
   confirmation can be heard.
2. `EventForm` is event-specific by design; `DataGrid` and `Timeline` are the
   generic components. The brief asks for an “Add / Edit Event” form, so the
   domain coupling is intentional.
3. The timeline renders a window over the 100k store rather than all 100k
   events. The default window still contains 10,400 events, which meets the
   “at least 10,000 timeline events” requirement.
