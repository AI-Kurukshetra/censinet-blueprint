import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { z } from 'zod'

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const user_id = searchParams.get('user_id')
    const resource_type = searchParams.get('resource_type')
    const action = searchParams.get('action')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    if (from_date) {
      const parsed = dateLikeString.safeParse(from_date)
      if (!parsed.success) return errorResponse('Invalid from_date filter', 400)
    }
    if (to_date) {
      const parsed = dateLikeString.safeParse(to_date)
      if (!parsed.success) return errorResponse('Invalid to_date filter', 400)
    }

    let query = supabase
      .from('audit_logs')
      .select('*, user_profiles(first_name, last_name, email)', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (user_id) query = query.eq('user_id', user_id)
    if (resource_type) query = query.eq('resource_type', resource_type)
    if (action) query = query.eq('action', action)
    if (from_date) query = query.gte('created_at', from_date)
    if (to_date) query = query.lte('created_at', to_date)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + per_page - 1)

    const { data, error, count } = await query

    if (error) return errorResponse(error.message)

    return successResponse({
      data,
      pagination: { page, per_page, total: count },
    })
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
