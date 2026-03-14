import { render, screen } from '@testing-library/react'
import { RiskBadge, RiskLevel } from '@/components/shared/risk-badge'

describe('RiskBadge', () => {
  const riskLevels: { level: RiskLevel; label: string; colorClass: string }[] = [
    { level: 'critical', label: 'Critical', colorClass: 'bg-red-100' },
    { level: 'high', label: 'High', colorClass: 'bg-orange-100' },
    { level: 'medium', label: 'Medium', colorClass: 'bg-yellow-100' },
    { level: 'low', label: 'Low', colorClass: 'bg-blue-100' },
    { level: 'minimal', label: 'Minimal', colorClass: 'bg-emerald-100' },
  ]

  it.each(riskLevels)(
    'renders "$label" text for risk level "$level"',
    ({ level, label }) => {
      render(<RiskBadge level={level} />)
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  )

  it.each(riskLevels)(
    'applies correct color class for "$level"',
    ({ level, colorClass }) => {
      const { container } = render(<RiskBadge level={level} />)
      const badge = container.querySelector('span')
      expect(badge?.className).toContain(colorClass)
    }
  )

  it('applies critical risk colors (red)', () => {
    const { container } = render(<RiskBadge level="critical" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-red-800')
    expect(badge?.className).toContain('border-red-200')
  })

  it('applies high risk colors (orange)', () => {
    const { container } = render(<RiskBadge level="high" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-orange-800')
    expect(badge?.className).toContain('border-orange-200')
  })

  it('applies medium risk colors (yellow)', () => {
    const { container } = render(<RiskBadge level="medium" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-yellow-800')
    expect(badge?.className).toContain('border-yellow-200')
  })

  it('applies low risk colors (blue)', () => {
    const { container } = render(<RiskBadge level="low" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-blue-800')
    expect(badge?.className).toContain('border-blue-200')
  })

  it('applies minimal risk colors (green/emerald)', () => {
    const { container } = render(<RiskBadge level="minimal" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-emerald-800')
    expect(badge?.className).toContain('border-emerald-200')
  })

  it('applies additional className when provided', () => {
    const { container } = render(
      <RiskBadge level="low" className="custom-class" />
    )
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('custom-class')
  })

  it('renders base styling classes', () => {
    const { container } = render(<RiskBadge level="critical" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('rounded-full')
    expect(badge?.className).toContain('text-xs')
    expect(badge?.className).toContain('font-semibold')
  })
})
