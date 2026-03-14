import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'

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

    let query = supabase
      .from('audit_logs')
      .select('*, user_profiles(full_name, email)', { count: 'exact' })
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
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
