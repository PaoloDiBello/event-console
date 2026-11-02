# Refactoring notes

The app was already feature-sliced, so this pass is behavior-preserving. The
goal is to make each file say one thing: orchestration hooks own state and
effects, pure models own data transformations, and presentational components
own markup.

## Principles

1. **One reason to change per file.** A component that owns filters, sorting,
   pagination, virtualization, focus, and keyboard navigation has too many
   reasons to change. Move each concern to a hook or a pure function.
2. **Hooks are controllers, not hiding places.** A hook should expose a small,
   named surface (`useDataGridController`, `useTimelineKeyboard`) rather than
   becoming the same component in a different file.
3. **Pure functions where possible.** Search haystacks, form-to-draft mapping,
   column labels, and empty-state copy are data transformations. They are easy
   to test and easy to reuse.
4. **One source of truth.** The global-search haystack is built in one place;
   the “is the feed loading?” rule is defined once; status/priority tones live
   with the model that owns them.
5. **Keep the public API stable.** Consumers still import `DataGrid`,
   `Timeline`, and `EventForm` from their existing barrels.

## Patterns borrowed from good codebases

- **Feature slices** (bulletproof-react, Cal.com): domain code stays under
  `features/events`; generic components never import event types.
- **Headless logic + thin views** (TanStack Table, Radix): the hard part lives
  outside the markup, so the view is composition rather than a control-flow
  diagram.
- **Primitive composition** (shadcn/ui): small presentational pieces
  (`DataGridColumnFilter`, `SpacerRow`) are composed by the orchestrator
  instead of growing one large component.
- **Explicit data boundaries** (Vercel Commerce): a feed hook
  (`useEventFeed`) is the only place pages read status/error/reload from the
  store.

## Refactor map

| Area | Before | After |
| --- | --- | --- |
| Grid state | ~200 lines of state, effects and handlers in `DataGrid.tsx` | `hooks/useDataGridController.ts` + `useRowReveal` + `useGridScrollReset` + `useDataGridShortcuts` |
| Grid presentation | filter controls and spacer rows duplicated in header/body | `DataGridColumnFilter`, `SpacerRow`, shared `columnLabel` |
| Timeline | virtualization, focus, announcements and keyboard logic in `Timeline.tsx` | `hooks/useTimelineModel`, `useTimelineFocus`, `useTimelineKeyboard`, `useTimelineAnnouncement` |
| Form | submit mapping, discard flow and focus effects in `EventForm.tsx` | `useEventFormController` + pure `toEventDraft` |
| Feed | `status === 'loading' || status === 'idle'` repeated in both pages | `useEventFeed` |
| Search haystack | built in both the generator and the store | `model/search.ts` |
| Timers | two copies of “clear after N ms” in `useEventEditor` | `shared/hooks/useTransientValue` |
| Form a11y | repeated `aria-invalid` / `aria-describedby` pairs | `fieldA11y` helper |
| Empty states | duplicated centering and copy layout in grid, agenda and timeline | shared `EmptyState` |
| Keyboard hints | three local `kbd` class strings | shared `Kbd` |

## Consistency conventions

- **File names** follow their role: components are `PascalCase.tsx`, hooks are
  `useX.ts`, and pure modules are `camelCase.ts`.
- **Hook inputs** are positional for one or two simple arguments
  (`useTimelineModel(groups, getItemId)`), and an options object once a hook has
  several inputs. Option interfaces are named `XOptions`.
- **Hook outputs** are inferred for local controller hooks. A named interface is
  used when the return shape is a shared model (`EventFeed`, `TimelineModel`,
  `RegistryStats`).
- **Callbacks** are wrapped in `useCallback` only when identity is part of the
  contract: effect dependencies, or a controller surface passed to
  memoized/virtualized children. Local form handlers stay plain because they are
  recreated with the form state anyway.
- **Types** use `interface` for object shapes and `type` for unions. Type-only
  imports use `import type` / inline `type` imports.
- **Placement**: generic components in `components/`, domain UI in
  `features/events/`, app shell in `app/components/`, and shared primitives in
  `components/ui/`. Tests sit next to the unit they cover.

## Guardrails

- No behavior changes; the existing behavior tests stay green.
- `npm test`, `npm run build`, and `npm run lint` are the acceptance gate.
- New pure helpers get a small test where they encode a rule (search text,
  draft mapping).
