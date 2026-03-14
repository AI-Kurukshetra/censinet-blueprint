import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/shared/stat-card'

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total Vendors" value={42} />)
    expect(screen.getByText('Total Vendors')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatCard title="Score" value="95%" />)
    expect(screen.getByText('95%')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <StatCard
        title="Active Vendors"
        value={10}
        description="from last month"
      />
    )
    expect(screen.getByText('from last month')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<StatCard title="Vendors" value={5} />)
    const descriptionEl = container.querySelector('.text-xs.text-muted-foreground')
    expect(descriptionEl).not.toBeInTheDocument()
  })

  it('renders trend indicator with up direction', () => {
    render(
      <StatCard
        title="Risk Score"
        value={75}
        trend={{ direction: 'up', value: 12 }}
      />
    )
    expect(screen.getByText('12%')).toBeInTheDocument()
  })

  it('renders trend indicator with down direction', () => {
    render(
      <StatCard
        title="Risk Score"
        value={75}
        trend={{ direction: 'down', value: 8 }}
      />
    )
    expect(screen.getByText('8%')).toBeInTheDocument()
  })

  it('applies emerald styling for upward trend', () => {
    const { container } = render(
      <StatCard
        title="Score"
        value={80}
        trend={{ direction: 'up', value: 5 }}
      />
    )
    const trendBadge = container.querySelector('.bg-emerald-50')
    expect(trendBadge).toBeInTheDocument()
  })

  it('applies red styling for downward trend', () => {
    const { container } = render(
      <StatCard
        title="Score"
        value={80}
        trend={{ direction: 'down', value: 3 }}
      />
    )
    const trendBadge = container.querySelector('.bg-red-50')
    expect(trendBadge).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <StatCard
        title="Vendors"
        value={10}
        icon={<span data-testid="test-icon">icon</span>}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<StatCard title="Vendors" value={10} />)
    const iconContainer = container.querySelector('.bg-blue-50')
    expect(iconContainer).not.toBeInTheDocument()
  })

  it('handles missing optional props gracefully', () => {
    const { container } = render(<StatCard title="Minimal Card" value={0} />)
    expect(screen.getByText('Minimal Card')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument()
  })

  it('applies additional className when provided', () => {
    const { container } = render(
      <StatCard title="Test" value={1} className="custom-class" />
    )
    const card = container.firstElementChild
    expect(card?.className).toContain('custom-class')
  })
})
