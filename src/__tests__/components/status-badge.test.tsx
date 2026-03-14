import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/shared/status-badge'

describe('StatusBadge', () => {
  describe('renders correct status text', () => {
    it('renders status text with first letter capitalized', () => {
      render(<StatusBadge status="active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders hyphenated status with spaces', () => {
      render(<StatusBadge status="in-progress" variant="assessment" />)
      expect(screen.getByText('In progress')).toBeInTheDocument()
    })

    it('renders status preserving original casing after first char', () => {
      render(<StatusBadge status="pending" />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  describe('applies correct styling for vendor variant (default)', () => {
    it('applies emerald styling for active status', () => {
      const { container } = render(<StatusBadge status="active" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-emerald-100')
      expect(badge?.className).toContain('text-emerald-800')
    })

    it('applies slate styling for inactive status', () => {
      const { container } = render(<StatusBadge status="inactive" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-slate-100')
      expect(badge?.className).toContain('text-slate-800')
    })

    it('applies yellow styling for pending status', () => {
      const { container } = render(<StatusBadge status="pending" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-yellow-100')
      expect(badge?.className).toContain('text-yellow-800')
    })

    it('applies red styling for suspended status', () => {
      const { container } = render(<StatusBadge status="suspended" />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-red-100')
      expect(badge?.className).toContain('text-red-800')
    })
  })

  describe('applies correct styling for assessment variant', () => {
    it('applies emerald styling for completed', () => {
      const { container } = render(
        <StatusBadge status="completed" variant="assessment" />
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-emerald-100')
    })

    it('applies red styling for overdue', () => {
      const { container } = render(
        <StatusBadge status="overdue" variant="assessment" />
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-red-100')
    })
  })

  describe('applies correct styling for incident variant', () => {
    it('applies red styling for open', () => {
      const { container } = render(
        <StatusBadge status="open" variant="incident" />
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-red-100')
    })

    it('applies emerald styling for resolved', () => {
      const { container } = render(
        <StatusBadge status="resolved" variant="incident" />
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('bg-emerald-100')
    })
  })

  it('falls back to default style for unknown status', () => {
    const { container } = render(<StatusBadge status="unknown-status" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('bg-slate-100')
    expect(badge?.className).toContain('text-slate-800')
  })

  it('applies additional className when provided', () => {
    const { container } = render(
      <StatusBadge status="active" className="extra-class" />
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('extra-class')
  })

  it('renders base styling classes', () => {
    const { container } = render(<StatusBadge status="active" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('rounded-full')
    expect(badge?.className).toContain('text-xs')
    expect(badge?.className).toContain('font-semibold')
  })
})
