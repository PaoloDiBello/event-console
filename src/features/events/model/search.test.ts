import { describe, expect, it } from 'vitest'
import { buildSearchText, matchesNormalizedSearch, matchesSearch } from './search'

const event = {
  title: 'Deploy Billing-API',
  owner: 'Nora Haddad',
  location: 'EU-West-1',
  category: 'deploy',
  status: 'at_risk',
  priority: 'critical',
  date: '2026-11-02',
} as const

describe('buildSearchText', () => {
  it('lowercases and includes every searchable field', () => {
    expect(buildSearchText(event)).toBe(
      'deploy billing-api nora haddad eu-west-1 deploy at_risk critical 2026-11-02',
    )
  })
})

describe('search matching', () => {
  const record = { search: buildSearchText(event) }

  it('normalizes the query and matches the haystack', () => {
    expect(matchesSearch(record, '  BILLING-API ')).toBe(true)
    expect(matchesSearch(record, 'missing')).toBe(false)
  })

  it('treats an empty normalized query as a match', () => {
    expect(matchesNormalizedSearch(record, '')).toBe(true)
  })
})
