import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const is_read = searchParams.get('is_read')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .eq('organization_id', auth.profile.organization_id)

    if (is_read !== null && is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true')
    }

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json()

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        ...body,
        organization_id: auth.profile.organization_id,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    return successResponse(data, 201)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json()

    if (body.all === true) {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .eq('organization_id', auth.profile.organization_id)
        .eq('is_read', false)

      if (error) return errorResponse(error.message)

      return successResponse({ message: 'All alerts marked as read' })
    }

    if (body.id) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', body.id)
        .eq('user_id', auth.user.id)
        .select()
        .single()

      if (error) return errorResponse(error.message)

      return successResponse(data)
    }

    return errorResponse('Must provide "id" or "all: true"', 400)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
