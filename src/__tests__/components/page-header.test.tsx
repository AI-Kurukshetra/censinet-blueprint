import { render, screen } from '@testing-library/react'
import { PageHeader } from '@/components/shared/page-header'

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Vendor Management" />)
    expect(
      screen.getByRole('heading', { name: 'Vendor Management' })
    ).toBeInTheDocument()
  })

  it('renders the title as an h1 element', () => {
    render(<PageHeader title="Dashboard" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Dashboard')
  })

  it('renders optional description when provided', () => {
    render(
      <PageHeader
        title="Vendors"
        description="Manage your healthcare vendors"
      />
    )
    expect(
      screen.getByText('Manage your healthcare vendors')
    ).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Vendors" />)
    const descriptionEl = container.querySelector('.text-muted-foreground')
    expect(descriptionEl).not.toBeInTheDocument()
  })

  it('renders children (action buttons)', () => {
    render(
      <PageHeader title="Vendors">
        <button>Add Vendor</button>
        <button>Export</button>
      </PageHeader>
    )
    expect(screen.getByText('Add Vendor')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('does not render children container when no children provided', () => {
    const { container } = render(<PageHeader title="Test" />)
    const childrenWrapper = container.querySelector('.flex.items-center.gap-2')
    expect(childrenWrapper).not.toBeInTheDocument()
  })

  it('renders title, description, and children together', () => {
    render(
      <PageHeader title="Risk Assessments" description="Review vendor risks">
        <button>New Assessment</button>
      </PageHeader>
    )
    expect(
      screen.getByRole('heading', { name: 'Risk Assessments' })
    ).toBeInTheDocument()
    expect(screen.getByText('Review vendor risks')).toBeInTheDocument()
    expect(screen.getByText('New Assessment')).toBeInTheDocument()
  })
})
