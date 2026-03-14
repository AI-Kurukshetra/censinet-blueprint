import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { errorResponse, getAuthContext, successResponse, unauthorizedResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import type { UserRole } from '@/types/database'

const MANAGE_ROLES: UserRole[] = ['owner', 'admin']
const ASSIGNABLE_ROLES: UserRole[] = [
  'owner',
  'admin',
  'compliance_officer',
  'risk_manager',
  'analyst',
  'viewer',
]

function canManageMembers(role: string): role is UserRole {
  return MANAGE_ROLES.includes(role as UserRole)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()
    if (!canManageMembers(auth.profile.role)) {
      return errorResponse('Forbidden', 403)
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, role, is_active, last_login, created_at')
      .eq('organization_id', auth.profile.organization_id)
      .order('created_at', { ascending: true })

    if (error) return errorResponse(error.message)
    return successResponse({ members: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load members'
    return errorResponse(message)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()
    if (!canManageMembers(auth.profile.role)) {
      return errorResponse('Forbidden', 403)
    }

    const body = await request.json()
    const memberId = typeof body.member_id === 'string' ? body.member_id : ''
    if (!memberId) return errorResponse('member_id is required', 400)

    const nextRole =
      typeof body.role === 'string' && ASSIGNABLE_ROLES.includes(body.role as UserRole)
        ? (body.role as UserRole)
        : undefined
    const nextIsActive = typeof body.is_active === 'boolean' ? body.is_active : undefined

    if (nextRole === undefined && nextIsActive === undefined) {
      return errorResponse('Nothing to update', 400)
    }

    const { data: target, error: targetError } = await supabase
      .from('user_profiles')
      .select('id, role, organization_id')
      .eq('id', memberId)
      .single()

    if (targetError || !target) return errorResponse('Member not found', 404)
    if (target.organization_id !== auth.profile.organization_id) {
      return errorResponse('Forbidden', 403)
    }

    if (auth.profile.role !== 'owner') {
      if (target.role === 'owner') {
        return errorResponse('Admins cannot modify owners', 403)
      }
      if (nextRole === 'owner') {
        return errorResponse('Only owners can assign owner role', 403)
      }
    }

    if (memberId === auth.user.id && nextIsActive === false) {
      return errorResponse('You cannot deactivate your own account', 400)
    }

    const updates: { role?: UserRole; is_active?: boolean } = {}
    if (nextRole !== undefined) updates.role = nextRole
    if (nextIsActive !== undefined) updates.is_active = nextIsActive

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', memberId)
      .eq('organization_id', auth.profile.organization_id)
      .select('id, first_name, last_name, email, role, is_active, last_login, created_at')
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'update',
      resourceType: 'member',
      resourceId: memberId,
      metadata: updates,
    })

    return successResponse({ member: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update member'
    return errorResponse(message)
  }
}
