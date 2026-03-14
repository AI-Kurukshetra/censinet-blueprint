import { NextRequest } from 'next/server'

const mockSingle = jest.fn()
const mockRange = jest.fn()
const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
const mockEqChain = jest.fn().mockReturnValue({ order: mockOrder, eq: jest.fn().mockReturnValue({ order: mockOrder }) })
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

import { GET, POST } from '@/app/api/assessments/route'
import { getAuthContext } from '@/lib/api-utils'

const mockedGetAuthContext = getAuthContext as jest.MockedFunction<typeof getAuthContext>

function createRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('Assessments API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/assessments', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockedGetAuthContext.mockResolvedValue(null)

      const request = createRequest('/api/assessments')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('returns assessments for authenticated user', async () => {
      mockedGetAuthContext.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { organization_id: 'org-1', role: 'admin' },
      })

      const assessmentsData = [
        {
          id: 'a-1',
          vendor_id: 'v-1',
          status: 'completed',
          risk_level: 'medium',
          vendors: { name: 'Vendor A' },
        },
      ]
      mockRange.mockResolvedValueOnce({
        data: assessmentsData,
        error: null,
        count: 1,
      })

      const request = createRequest('/api/assessments')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toBeDefined()
      expect(body.pagination).toBeDefined()
    })
  })

  describe('POST /api/assessments', () => {
    it('returns 401 for unauthenticated requests', async () => {
      mockedGetAuthContext.mockResolvedValue(null)

      const request = createRequest('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({ vendor_id: 'v-1' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('creates assessment for authenticated user', async () => {
      const newAssessment = {
        id: 'a-new',
        vendor_id: 'v-1',
        status: 'pending',
        organization_id: 'org-1',
        created_by: 'user-1',
      }

      mockedGetAuthContext.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        profile: { organization_id: 'org-1', role: 'admin' },
      })

      mockSingle.mockResolvedValueOnce({
        data: newAssessment,
        error: null,
      })

      const request = createRequest('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({ vendor_id: 'v-1', title: 'Q1 Assessment' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.vendor_id).toBe('v-1')
    })
  })
})
