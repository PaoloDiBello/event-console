import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import type { Table } from '@tanstack/react-table'
import { Check, Columns3 } from 'lucide-react'
import { columnLabel } from './utils'

interface DataGridColumnMenuProps<TData> {
  table: Table<TData>
  disabled?: boolean
}

export function DataGridColumnMenu<TData>({
  table,
  disabled = false,
}: DataGridColumnMenuProps<TData>) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && column.columnDef.meta?.hideable !== false)
  // The badge counts what the menu can toggle, so it matches the list below it
  // instead of including structural columns like the row actions.
  const visibleCount = hideableColumns.filter((column) => column.getIsVisible()).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-line bg-raised px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          <Columns3 aria-hidden="true" className="size-3.5" />
          Columns
          <span className="rounded-xs bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-faint">
            {visibleCount}/{hideableColumns.length}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="z-50 min-w-52 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
      >
        <DropdownMenuLabel className="px-2 py-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
          Visible columns
        </DropdownMenuLabel>
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={() => column.toggleVisibility()}
            // Keep the menu open so several columns can be toggled in a row.
            onSelect={(event) => event.preventDefault()}
            className="flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink"
          >
            {/* The item is the state; this slot makes it visible. Radix only
                mounts the indicator while the item is checked. */}
            <span className="flex size-3.5 shrink-0 items-center justify-center">
              <DropdownMenuItemIndicator>
                <Check aria-hidden="true" className="size-3.5 text-accent" />
              </DropdownMenuItemIndicator>
            </span>
            <span className="truncate">
              {columnLabel(table.getColumn(column.id), column.id)}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator className="my-1 h-px bg-line" />
        <DropdownMenuItem
          onSelect={() => table.setColumnVisibility({})}
          className="cursor-pointer rounded-xs px-2 py-1.5 text-xs text-faint outline-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink"
        >
          Show all columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
