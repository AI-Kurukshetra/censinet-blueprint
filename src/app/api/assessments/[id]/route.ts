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
      .from('risk_assessments')
      .select('*, vendors(name)')
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
      .from('risk_assessments')
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
      resourceType: 'assessment',
      resourceId: id,
      metadata: { fields: Object.keys(body) },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    if (!body.action || !['submit', 'complete'].includes(body.action)) {
      return errorResponse('Invalid action. Must be "submit" or "complete"', 400)
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.action === 'submit') {
      updateData.status = 'submitted'
      updateData.submitted_at = new Date().toISOString()
      updateData.submitted_by = auth.user.id
    } else if (body.action === 'complete') {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = auth.user.id
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: body.action,
      resourceType: 'assessment',
      resourceId: id,
      metadata: { action: body.action },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
