import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItemIndicator,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/shared/lib/cn'

interface DataGridPageSizeProps {
  pageSize: number
  options: readonly number[]
  onChange: (pageSize: number) => void
}

const ITEM_CLASS =
  'flex cursor-pointer items-center gap-2 rounded-xs py-1.5 pr-2 pl-1.5 font-mono text-xs text-muted outline-none select-none data-[highlighted]:bg-canvas data-[highlighted]:text-ink data-[state=checked]:text-ink'

/**
 * Rows-per-page as an in-app menu, so it matches the column filters and the
 * Columns menu instead of opening the operating system's native popup.
 */
export function DataGridPageSize({ pageSize, options, onChange }: DataGridPageSizeProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <span className="text-faint">Rows per page</span>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Rows per page, currently ${pageSize}`}
            title="Change rows per page"
            className="flex h-8 items-center gap-1 rounded-xs border border-line bg-canvas pr-1.5 pl-2 font-mono text-xs text-ink transition-colors hover:border-line-strong focus:border-accent/60 focus:outline-none data-[state=open]:border-accent/70 data-[state=open]:bg-raised"
          >
            {pageSize}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-3 text-faint transition-transform duration-150',
                open && 'rotate-180',
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            collisionPadding={8}
            className="z-50 min-w-28 rounded-md border border-line-strong bg-raised p-1 shadow-2xl shadow-black/60"
          >
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(next) => onChange(Number(next))}
            >
              {options.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)} className={ITEM_CLASS}>
                  <span className="flex size-3.5 shrink-0 items-center justify-center">
                    <DropdownMenuItemIndicator>
                      <Check aria-hidden="true" className="size-3.5 text-accent" />
                    </DropdownMenuItemIndicator>
                  </span>
                  <span className="truncate">{size}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  )
}
