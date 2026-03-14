import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable, ColumnDef } from '@/components/shared/data-table'

interface TestRow {
  id: string
  name: string
  score: number
}

const testColumns: ColumnDef<TestRow>[] = [
  { id: 'name', header: 'Name', accessor: 'name', sortable: true },
  { id: 'score', header: 'Score', accessor: 'score', sortable: true },
]

const testData: TestRow[] = [
  { id: '1', name: 'Vendor A', score: 85 },
  { id: '2', name: 'Vendor B', score: 92 },
  { id: '3', name: 'Vendor C', score: 78 },
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        keyExtractor={(row) => row.id}
      />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Vendor A')).toBeInTheDocument()
    expect(screen.getByText('Vendor B')).toBeInTheDocument()
    expect(screen.getByText('Vendor C')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('92')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(
      <DataTable columns={testColumns} data={[]} loading={true} />
    )
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
    // Should render 5 skeleton rows with 2 columns each = 10 skeleton cells
    expect(skeletons.length).toBe(10)
  })

  it('shows column headers when loading', () => {
    render(
      <DataTable columns={testColumns} data={[]} loading={true} />
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('shows empty state when data is empty', () => {
    render(<DataTable columns={testColumns} data={[]} />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(
      screen.getByText('Try adjusting your search or filter criteria.')
    ).toBeInTheDocument()
  })

  it('shows custom empty message', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        emptyMessage="No vendors"
        emptyDescription="Add a vendor to get started."
      />
    )
    expect(screen.getByText('No vendors')).toBeInTheDocument()
    expect(screen.getByText('Add a vendor to get started.')).toBeInTheDocument()
  })

  it('renders with custom cell renderer', () => {
    const columnsWithCustomCell: ColumnDef<TestRow>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: 'name',
        cell: (row) => <strong data-testid="bold-name">{row.name}</strong>,
      },
      { id: 'score', header: 'Score', accessor: 'score' },
    ]
    render(
      <DataTable columns={columnsWithCustomCell} data={testData} />
    )
    const boldNames = screen.getAllByTestId('bold-name')
    expect(boldNames.length).toBe(3)
  })

  describe('pagination', () => {
    const manyRows: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      name: `Vendor ${i + 1}`,
      score: 50 + i,
    }))

    it('paginates data with default pageSize of 10', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      expect(screen.getByText('Vendor 1')).toBeInTheDocument()
      expect(screen.getByText('Vendor 10')).toBeInTheDocument()
      expect(screen.queryByText('Vendor 11')).not.toBeInTheDocument()
    })

    it('shows pagination controls when data exceeds pageSize', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      expect(screen.getByText(/Showing 1 to 10 of 25/)).toBeInTheDocument()
    })

    it('navigates to next page', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByText('Vendor 11')).toBeInTheDocument()
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    it('navigates to previous page', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
      expect(screen.getByText('Vendor 1')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('disables Previous button on first page', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    })

    it('disables Next button on last page', () => {
      render(<DataTable columns={testColumns} data={manyRows} />)
      // Navigate to last page
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    })

    it('does not show pagination when data fits in one page', () => {
      render(<DataTable columns={testColumns} data={testData} />)
      expect(screen.queryByText(/Page/)).not.toBeInTheDocument()
    })

    it('respects custom pageSize', () => {
      render(
        <DataTable columns={testColumns} data={manyRows} pageSize={5} />
      )
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument()
      expect(screen.getByText(/Showing 1 to 5 of 25/)).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('sorts ascending on first click of sortable column', () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )
      fireEvent.click(screen.getByText('Name'))
      const rows = screen.getAllByRole('row')
      // First row is header, then sorted data rows
      expect(rows[1]).toHaveTextContent('Vendor A')
      expect(rows[2]).toHaveTextContent('Vendor B')
      expect(rows[3]).toHaveTextContent('Vendor C')
    })

    it('sorts descending on second click', () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )
      fireEvent.click(screen.getByText('Name'))
      fireEvent.click(screen.getByText('Name'))
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Vendor C')
      expect(rows[2]).toHaveTextContent('Vendor B')
      expect(rows[3]).toHaveTextContent('Vendor A')
    })

    it('clears sort on third click', () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          keyExtractor={(row) => row.id}
        />
      )
      fireEvent.click(screen.getByText('Name'))
      fireEvent.click(screen.getByText('Name'))
      fireEvent.click(screen.getByText('Name'))
      // Data should be back to original order
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('Vendor A')
    })

    it('sets aria-sort attribute on sorted column', () => {
      render(
        <DataTable columns={testColumns} data={testData} />
      )
      fireEvent.click(screen.getByText('Name'))
      const nameHeader = screen.getByText('Name').closest('th')
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    })
  })

  it('calls onRowClick when a row is clicked', () => {
    const handleRowClick = jest.fn()
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        onRowClick={handleRowClick}
        keyExtractor={(row) => row.id}
      />
    )
    fireEvent.click(screen.getByText('Vendor A'))
    expect(handleRowClick).toHaveBeenCalledWith(testData[0])
  })

  it('makes rows keyboard accessible when onRowClick is provided', () => {
    const handleRowClick = jest.fn()
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        onRowClick={handleRowClick}
        keyExtractor={(row) => row.id}
      />
    )
    const row = screen.getByText('Vendor A').closest('tr')
    expect(row).toHaveAttribute('role', 'button')
    expect(row).toHaveAttribute('tabindex', '0')
  })
})
