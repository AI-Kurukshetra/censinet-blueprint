import { NextRequest } from 'next/server'

// Mock supabase and audit before importing the route
const mockSingle = jest.fn()
const mockRange = jest.fn().mockImplementation(() => ({
  then: (resolve: any) =>
    resolve({
      data: [{ id: '1', name: 'Test Vendor' }],
      error: null,
      count: 1,
    }),
}))
const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
const mockIlike = jest.fn().mockReturnValue({ order: mockOrder })
const mockEqChain = jest.fn().mockReturnValue({ ilike: mockIlike, order: mockOrder, eq: jest.fn().mockReturnValue({ order: mockOrder }) })
const mockSelect = jest.fn().mockReturnValue({ eq: mockEqChain })
const mockInsertSelect = jest.fn().mockReturnValue({ single: mockSingle })
const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect })

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEqChain,
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue(mockSupabase),
}))

jest.mock('@/lib/api-utils', () => {
  const actual = jest.requireActual('@/lib/api-utils')
  return {
    ...actual,
    getAuthContext: jest.fn(),
  }
})

jest.mock('@/modules/auth/audit.service', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}))

import { GET, POST } from '@/app/api/vendors/route'
import { getAuthContext } from '@/lib/api-utils'

const mockedGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('Vendors API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/vendors', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockedGetAuthContext.mockResolvedValue(null)

      const request = createRequest('/api/vendors')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns vendors list for authenticated user', async () => {
      mockedGetAuthContext.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { organization_id: 'org-1', role: 'admin' },
      })

      // Configure the chain for GET: from().select().eq().order().range()
      const vendorsData = [
        { id: '1', name: 'Vendor A', status: 'active' },
        { id: '2', name: 'Vendor B', status: 'pending' },
      ]
      mockRange.mockResolvedValueOnce({
        data: vendorsData,
        error: null,
        count: 2,
      })

      const request = createRequest('/api/vendors')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toBeDefined()
      expect(body.pagination).toBeDefined()
    })
  })

  describe('POST /api/vendors', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockedGetAuthContext.mockResolvedValue(null)

      const request = createRequest('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Vendor' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns 400 when name is missing', async () => {
      mockedGetAuthContext.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { organization_id: 'org-1', role: 'admin' },
      })

      const request = createRequest('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({ error: 'Name is required' })
    })

    it('creates vendor with valid data', async () => {
      const newVendor = {
        id: 'vendor-new',
        name: 'New Healthcare Vendor',
        status: 'active',
        organization_id: 'org-1',
      }

      mockedGetAuthContext.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { organization_id: 'org-1', role: 'admin' },
      })

      mockSingle.mockResolvedValueOnce({
        data: newVendor,
        error: null,
      })

      const request = createRequest('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Healthcare Vendor' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.name).toBe('New Healthcare Vendor')
    })
  })
})
