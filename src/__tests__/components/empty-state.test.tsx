import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '@/components/shared/empty-state'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No vendors found" />)
    expect(screen.getByText('No vendors found')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search criteria"
      />
    )
    expect(
      screen.getByText('Try adjusting your search criteria')
    ).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(0)
  })

  it('renders action button when actionLabel and onAction are provided', () => {
    const handleAction = jest.fn()
    render(
      <EmptyState
        title="No vendors"
        actionLabel="Add Vendor"
        onAction={handleAction}
      />
    )
    expect(screen.getByText('Add Vendor')).toBeInTheDocument()
  })

  it('does not render action button when only actionLabel is provided', () => {
    render(<EmptyState title="No vendors" actionLabel="Add Vendor" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('does not render action button when only onAction is provided', () => {
    const handleAction = jest.fn()
    render(<EmptyState title="No vendors" onAction={handleAction} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when the action button is clicked', () => {
    const handleAction = jest.fn()
    render(
      <EmptyState
        title="No vendors"
        actionLabel="Add Vendor"
        onAction={handleAction}
      />
    )
    fireEvent.click(screen.getByText('Add Vendor'))
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="empty-icon">icon</span>}
      />
    )
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
  })

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const iconContainer = container.querySelector('.rounded-full')
    expect(iconContainer).not.toBeInTheDocument()
  })

  it('applies additional className when provided', () => {
    const { container } = render(
      <EmptyState title="Empty" className="custom-empty" />
    )
    const wrapper = container.firstElementChild
    expect(wrapper?.className).toContain('custom-empty')
  })
})
