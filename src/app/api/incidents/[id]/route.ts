import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params

    const { data, error } = await supabase
      .from('incidents')
      .select('*, vendors(name), incident_updates(*)')
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (error) return errorResponse(error.message, 404)

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
      .from('incidents')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'update',
      resourceType: 'incident',
      resourceId: id,
      metadata: { fields: Object.keys(body) },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    if (!body.content) {
      return errorResponse('Content is required', 400)
    }

    // Verify the incident belongs to the org
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('id')
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (incidentError || !incident) {
      return errorResponse('Incident not found', 404)
    }

    const { data, error } = await supabase
      .from('incident_updates')
      .insert({
        incident_id: id,
        content: body.content,
        is_internal: body.is_internal ?? false,
        user_id: auth.user.id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'incident_update',
      resourceId: data.id,
      metadata: { incident_id: id, is_internal: body.is_internal ?? false },
    })

    return successResponse(data, 201)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
