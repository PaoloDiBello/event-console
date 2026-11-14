import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Kbd } from './Kbd'

describe('Kbd', () => {
  it('renders text children directly', () => {
    render(<Kbd>Esc</Kbd>)
    expect(screen.getByText('Esc')).toBeInTheDocument()
  })

  it('renders SVG icon glyphs for arrow and enter keys', () => {
    const { container, rerender } = render(<Kbd>↑</Kbd>)
    expect(screen.getByLabelText('Up arrow')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()

    rerender(<Kbd>↓</Kbd>)
    expect(screen.getByLabelText('Down arrow')).toBeInTheDocument()

    rerender(<Kbd>←</Kbd>)
    expect(screen.getByLabelText('Left arrow')).toBeInTheDocument()

    rerender(<Kbd>→</Kbd>)
    expect(screen.getByLabelText('Right arrow')).toBeInTheDocument()

    rerender(<Kbd>↵</Kbd>)
    expect(screen.getByLabelText('Enter')).toBeInTheDocument()
  })

  it('respects ariaHidden on icon glyphs', () => {
    const { container } = render(<Kbd ariaHidden>↑</Kbd>)
    const kbd = container.querySelector('kbd')
    expect(kbd).toHaveAttribute('aria-hidden', 'true')
    expect(kbd).not.toHaveAttribute('aria-label')
    expect(kbd).toHaveAttribute('title', 'Up arrow')
  })
})
