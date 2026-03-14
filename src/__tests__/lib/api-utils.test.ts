/**
 * @jest-environment node
 */
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  getPaginationParams,
  getAuthContext,
} from '@/lib/api-utils'

describe('api-utils', () => {
  describe('successResponse', () => {
    it('returns JSON response with data and default 200 status', async () => {
      const data = { vendors: [{ id: '1', name: 'Test Vendor' }] }
      const response = successResponse(data)
      const body = await response.json()
      expect(body).toEqual(data)
      expect(response.status).toBe(200)
    })

    it('returns JSON response with custom status code', async () => {
      const data = { id: '1', name: 'New Vendor' }
      const response = successResponse(data, 201)
      const body = await response.json()
      expect(body).toEqual(data)
      expect(response.status).toBe(201)
    })

    it('handles null data', async () => {
      const response = successResponse(null)
      const body = await response.json()
      expect(body).toBeNull()
      expect(response.status).toBe(200)
    })
  })

  describe('errorResponse', () => {
    it('returns JSON response with error message and default 500 status', async () => {
      const response = errorResponse('Something went wrong')
      const body = await response.json()
      expect(body).toEqual({ error: 'Something went wrong' })
      expect(response.status).toBe(500)
    })

    it('returns JSON response with custom status code', async () => {
      const response = errorResponse('Not found', 404)
      const body = await response.json()
      expect(body).toEqual({ error: 'Not found' })
      expect(response.status).toBe(404)
    })

    it('returns 400 for validation errors', async () => {
      const response = errorResponse('Name is required', 400)
      const body = await response.json()
      expect(body).toEqual({ error: 'Name is required' })
      expect(response.status).toBe(400)
    })
  })

  describe('unauthorizedResponse', () => {
    it('returns 401 status', async () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
    })

    it('returns Unauthorized error message', async () => {
      const response = unauthorizedResponse()
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('getPaginationParams', () => {
    it('extracts default pagination params when none provided', () => {
      const params = new URLSearchParams()
      const result = getPaginationParams(params)
      expect(result).toEqual({ page: 1, per_page: 20, offset: 0 })
    })

    it('extracts page and per_page from search params', () => {
      const params = new URLSearchParams({ page: '3', per_page: '50' })
      const result = getPaginationParams(params)
      expect(result).toEqual({ page: 3, per_page: 50, offset: 100 })
    })

    it('calculates correct offset', () => {
      const params = new URLSearchParams({ page: '2', per_page: '10' })
      const result = getPaginationParams(params)
      expect(result.offset).toBe(10)
    })

    it('enforces minimum page of 1', () => {
      const params = new URLSearchParams({ page: '0' })
      const result = getPaginationParams(params)
      expect(result.page).toBe(1)
    })

    it('enforces minimum page of 1 for negative values', () => {
      const params = new URLSearchParams({ page: '-5' })
      const result = getPaginationParams(params)
      expect(result.page).toBe(1)
    })

    it('enforces maximum per_page of 100', () => {
      const params = new URLSearchParams({ per_page: '200' })
      const result = getPaginationParams(params)
      expect(result.per_page).toBe(100)
    })

    it('enforces minimum per_page of 1', () => {
      const params = new URLSearchParams({ per_page: '0' })
      const result = getPaginationParams(params)
      expect(result.per_page).toBe(1)
    })

    it('handles non-numeric values by falling back to defaults', () => {
      const params = new URLSearchParams({ page: 'abc', per_page: 'xyz' })
      const result = getPaginationParams(params)
      expect(result.page).toBe(1)
    })
  })

  describe('getAuthContext', () => {
    it('returns null when getUser returns an error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Invalid token'),
          }),
        },
        from: jest.fn(),
      }
      const result = await getAuthContext(mockSupabase)
      expect(result).toBeNull()
    })

    it('returns null when no user is found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: jest.fn(),
      }
      const result = await getAuthContext(mockSupabase)
      expect(result).toBeNull()
    })

    it('returns null when profile is not found', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1', email: 'test@test.com' } },
            error: null,
          }),
        },
        from: mockFrom,
      }
      const result = await getAuthContext(mockSupabase)
      expect(result).toBeNull()
    })

    it('returns user and profile when authenticated', async () => {
      const user = { id: 'user-1', email: 'test@test.com' }
      const profile = { organization_id: 'org-1', role: 'admin' }
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: profile, error: null }),
      })
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user },
            error: null,
          }),
        },
        from: mockFrom,
      }
      const result = await getAuthContext(mockSupabase)
      expect(result).toEqual({ user, profile })
    })
  })
})
