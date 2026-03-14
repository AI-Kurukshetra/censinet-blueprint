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

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*, assessments(*)')
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (error) return errorResponse(error.message, 404)

    return successResponse(vendor)
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
      .from('vendors')
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
      resourceType: 'vendor',
      resourceId: id,
      metadata: { fields: Object.keys(body) },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params

    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'delete',
      resourceType: 'vendor',
      resourceId: id,
      metadata: { soft_delete: true },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
