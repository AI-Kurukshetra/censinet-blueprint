import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json()

    // Only allow updating specific profile fields
    const allowedFields = ['first_name', 'last_name', 'phone', 'job_title', 'department']
    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', auth.user.id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'update',
      resourceType: 'user_profile',
      resourceId: auth.user.id,
      metadata: { fields: Object.keys(updates) },
    })

    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message)
  }
}
