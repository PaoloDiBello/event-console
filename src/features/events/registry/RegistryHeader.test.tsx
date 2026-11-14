import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RegistryHeader } from './RegistryHeader'

const baseProps = {
  status: 'ready' as const,
  nextWindow: 10_400,
  atRisk: 9_513,
  atRiskActive: false,
  onToggleAtRisk: vi.fn(),
  onOpenAgenda: vi.fn(),
  onReload: vi.fn(),
  onSimulateError: vi.fn(),
}

describe('RegistryHeader', () => {
  it('turns the at-risk metric into a quick filter', async () => {
    const user = userEvent.setup()
    const onToggleAtRisk = vi.fn()
    render(<RegistryHeader {...baseProps} onToggleAtRisk={onToggleAtRisk} />)

    const card = screen.getByRole('button', { name: /9,513\s*At risk/ })
    expect(card).toHaveAttribute('aria-pressed', 'false')

    await user.click(card)

    expect(onToggleAtRisk).toHaveBeenCalledTimes(1)
  })

  it('marks the at-risk metric as pressed while the filter is applied', () => {
    render(<RegistryHeader {...baseProps} atRiskActive />)

    expect(screen.getByRole('button', { name: /At risk/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('opens the agenda from the window metric', async () => {
    const user = userEvent.setup()
    const onOpenAgenda = vi.fn()
    render(<RegistryHeader {...baseProps} onOpenAgenda={onOpenAgenda} />)

    await user.click(screen.getByRole('button', { name: /10,400\s*Next 45 days/ }))

    expect(onOpenAgenda).toHaveBeenCalledTimes(1)
  })
})
