import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { z } from 'zod'
import type { Database } from '@/types/database'

type AlertType = Database['public']['Enums']['alert_type']
type AlertPriority = Database['public']['Enums']['alert_priority']

const alertTypes = [
  'contract_expiring',
  'baa_expiring',
  'assessment_due',
  'compliance_gap',
  'incident_reported',
  'risk_score_change',
  'document_expiring',
  'remediation_overdue',
  'vendor_status_change',
  'system',
] as const satisfies readonly AlertType[]

const alertPriorities = ['critical', 'high', 'medium', 'low', 'info'] as const satisfies readonly AlertPriority[]

const alertCreateSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  type: z.enum(alertTypes),
  priority: z.enum(alertPriorities),
  title: z.string().trim().min(1, 'title is required').max(200),
  message: z.string().trim().max(5000).optional().nullable(),
  source: z.string().trim().max(120).optional().nullable(),
  reference_id: z.string().trim().max(120).optional().nullable(),
  reference_type: z.string().trim().max(120).optional().nullable(),
})

const alertsPatchSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ id: z.string().uuid('id must be a valid UUID') }),
])

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
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json() as unknown
    const parsed = alertCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const targetUserId = parsed.data.user_id ?? auth.user.id

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        ...parsed.data,
        user_id: targetUserId,
        organization_id: auth.profile.organization_id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json() as unknown
    const parsed = alertsPatchSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse('Must provide "id" or "all: true"', 400)
    }

    if ('all' in parsed.data && parsed.data.all === true) {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', auth.user.id)
        .eq('organization_id', auth.profile.organization_id)
        .eq('is_read', false)

      if (error) return errorResponse(error.message)

      return successResponse({ message: 'All alerts marked as read' })
    }

    if ('id' in parsed.data) {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', parsed.data.id)
        .eq('user_id', auth.user.id)
        .eq('organization_id', auth.profile.organization_id)
        .select()
        .single()

      if (error) return errorResponse(error.message)

      return successResponse(data)
    }

    return errorResponse('Must provide "id" or "all: true"', 400)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
