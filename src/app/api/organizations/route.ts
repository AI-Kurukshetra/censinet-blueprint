import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', auth.profile.organization_id)
      .single()

    if (error) return errorResponse(error.message, 404)

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json()

    const { data, error } = await supabase
      .from('organizations')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', auth.profile.organization_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'update',
      resourceType: 'organization',
      resourceId: auth.profile.organization_id,
      metadata: { fields: Object.keys(body) },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
