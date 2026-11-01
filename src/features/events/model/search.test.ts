import { describe, expect, it } from 'vitest'
import { buildSearchText } from './search'

describe('buildSearchText', () => {
  it('lowercases and includes every searchable field', () => {
    expect(
      buildSearchText({
        title: 'Deploy Billing-API',
        owner: 'Nora Haddad',
        location: 'EU-West-1',
        category: 'deploy',
        status: 'at_risk',
        priority: 'critical',
        date: '2026-11-02',
      }),
    ).toBe('deploy billing-api nora haddad eu-west-1 deploy at_risk critical 2026-11-02')
  })
})
