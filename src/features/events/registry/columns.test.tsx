import { describe, expect, it, vi } from 'vitest'
import { createEventColumns } from './columns'

const onEdit = vi.fn()

describe('createEventColumns', () => {
  it('offers the data-derived values as Owner and Location facets', () => {
    const columns = createEventColumns(onEdit, {
      owners: ['Ana Sousa', 'Mira Okafor'],
      locations: ['HQ · Room 4'],
    })

    const owner = columns.find((column) => column.id === 'owner')
    const location = columns.find((column) => column.id === 'location')

    expect(owner?.meta).toMatchObject({
      filter: 'select',
      filterOptions: [
        { value: 'Ana Sousa', label: 'Ana Sousa' },
        { value: 'Mira Okafor', label: 'Mira Okafor' },
      ],
    })
    expect(owner?.filterFn).toBe('equalsString')

    expect(location?.meta).toMatchObject({
      filter: 'select',
      filterOptions: [{ value: 'HQ · Room 4', label: 'HQ · Room 4' }],
    })
    expect(location?.filterFn).toBe('equalsString')
  })

  it('renders an empty facet when no values are supplied', () => {
    const owner = createEventColumns(onEdit).find((column) => column.id === 'owner')

    expect(owner?.meta).toMatchObject({ filter: 'select', filterOptions: [] })
  })
})
