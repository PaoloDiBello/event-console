import { describe, expect, it } from 'vitest'
import {
  DEFAULT_REGISTRY_VIEW,
  hasColumnFilter,
  isExactlyColumnFilter,
  readRegistryView,
  withColumnFilter,
  writeRegistryView,
} from './registryView'

function params(search: string) {
  return new URLSearchParams(search)
}

describe('registryView', () => {
  it('falls back to the default view for an empty URL', () => {
    expect(readRegistryView(params(''))).toEqual(DEFAULT_REGISTRY_VIEW)
  })

  it('reads a complete shared view', () => {
    const view = readRegistryView(
      params('q=deploy&status=at_risk&priority=high&sort=title:asc&page=3&size=100'),
    )

    expect(view.globalFilter).toBe('deploy')
    // Facets read as lists even for one value, so the filter state has one shape.
    expect(view.columnFilters).toEqual([
      { id: 'status', value: ['at_risk'] },
      { id: 'priority', value: ['high'] },
    ])
    expect(view.sorting).toEqual([{ id: 'title', desc: false }])
    expect(view.pageIndex).toBe(2)
    expect(view.pageSize).toBe(100)
  })

  it('drops filters and settings a control could not produce', () => {
    const view = readRegistryView(
      params('status=nope&category=Deploy&when=2026-02-31&size=999&sort=missing:desc&page=-4'),
    )

    expect(view.columnFilters).toEqual([])
    expect(view.pageSize).toBe(50)
    expect(view.sorting).toEqual(DEFAULT_REGISTRY_VIEW.sorting)
    expect(view.pageIndex).toBe(0)
  })

  it('shares the owner and location facets as plain values', () => {
    const view = readRegistryView(params('owner=Mira+Okafor&location=HQ+%C2%B7+Room+4'))

    expect(view.columnFilters).toEqual([
      { id: 'owner', value: ['Mira Okafor'] },
      { id: 'location', value: ['HQ · Room 4'] },
    ])

    const written = writeRegistryView(view)
    expect(written.getAll('owner')).toEqual(['Mira Okafor'])
    expect(written.getAll('location')).toEqual(['HQ · Room 4'])
  })

  it('reads repeated parameters as one multi-value filter', () => {
    const view = readRegistryView(
      params('category=meeting&category=deploy&status=at_risk&status=scheduled'),
    )

    expect(view.columnFilters).toEqual([
      { id: 'category', value: ['meeting', 'deploy'] },
      { id: 'status', value: ['at_risk', 'scheduled'] },
    ])
  })

  it('drops unsupported values from a repeated parameter', () => {
    const view = readRegistryView(params('category=meeting&category=nope&category=meeting'))

    expect(view.columnFilters).toEqual([{ id: 'category', value: ['meeting'] }])
  })

  it('keeps the default view out of the URL', () => {
    expect(writeRegistryView(DEFAULT_REGISTRY_VIEW).toString()).toBe('')
  })

  it('opens nearest to today, and only writes a sort that differs from it', () => {
    // The default is the hidden relevance column: today first, then forward.
    expect(readRegistryView(params('')).sorting).toEqual([{ id: 'relevance', desc: true }])
    // Spelling the default out in a link still serializes to the plain view.
    expect(
      writeRegistryView({ ...DEFAULT_REGISTRY_VIEW, sorting: [{ id: 'relevance', desc: true }] })
        .toString(),
    ).toBe('')
    // The opposite direction is a real choice, so it survives the round trip.
    const flipped = writeRegistryView({
      ...DEFAULT_REGISTRY_VIEW,
      sorting: [{ id: 'relevance', desc: false }],
    })
    expect(flipped.get('sort')).toBe('relevance:asc')
    expect(readRegistryView(flipped).sorting).toEqual([{ id: 'relevance', desc: false }])
  })

  it('writes the non-default parts of a view', () => {
    const search = writeRegistryView({
      globalFilter: 'incident',
      columnFilters: [
        { id: 'status', value: ['at_risk', 'in_progress'] },
        { id: 'owner', value: ['Mira Okafor'] },
      ],
      sorting: [{ id: 'when', desc: false }],
      pageIndex: 4,
      pageSize: 25,
    })

    expect(search.get('q')).toBe('incident')
    expect(search.getAll('status')).toEqual(['at_risk', 'in_progress'])
    expect(search.getAll('owner')).toEqual(['Mira Okafor'])
    expect(search.get('sort')).toBe('when:asc')
    expect(search.get('page')).toBe('5')
    expect(search.get('size')).toBe('25')
  })

  it('round-trips a view through the URL', () => {
    const view = {
      globalFilter: 'release',
      columnFilters: [
        { id: 'when', value: '2026-11-13' },
        { id: 'priority', value: ['critical', 'high'] },
      ],
      sorting: [{ id: 'title', desc: true }],
      pageIndex: 1,
      pageSize: 250,
    }

    expect(readRegistryView(writeRegistryView(view))).toEqual(view)
  })

  it('toggles one column filter without touching the others', () => {
    const filters = [
      { id: 'priority', value: ['high'] },
      { id: 'status', value: ['scheduled'] },
    ]

    expect(hasColumnFilter(filters, 'status', 'scheduled')).toBe(true)
    expect(hasColumnFilter(filters, 'status', 'at_risk')).toBe(false)

    expect(withColumnFilter(filters, 'status', ['at_risk'])).toEqual([
      { id: 'priority', value: ['high'] },
      { id: 'status', value: ['at_risk'] },
    ])
    expect(withColumnFilter(filters, 'status', null)).toEqual([
      { id: 'priority', value: ['high'] },
    ])
  })

  it('reports a value as exactly filtered only when it is alone', () => {
    expect(isExactlyColumnFilter([{ id: 'status', value: ['at_risk'] }], 'status', 'at_risk')).toBe(
      true,
    )
    expect(
      isExactlyColumnFilter(
        [{ id: 'status', value: ['at_risk', 'scheduled'] }],
        'status',
        'at_risk',
      ),
    ).toBe(false)
    expect(isExactlyColumnFilter([], 'status', 'at_risk')).toBe(false)
  })
})
