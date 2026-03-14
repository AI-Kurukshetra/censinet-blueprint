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
    const status = searchParams.get('status')
    const framework = searchParams.get('framework')
    const vendor_id = searchParams.get('vendor_id')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('compliance_items')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status) query = query.eq('status', status as any)
    if (framework) query = query.eq('framework', framework)
    if (vendor_id) query = query.eq('vendor_id', vendor_id)

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
      .from('compliance_items')
      .insert({
        ...body,
        organization_id: auth.profile.organization_id,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'compliance_item',
      resourceId: data.id,
      metadata: { framework: body.framework },
    })

    return successResponse(data, 201)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
