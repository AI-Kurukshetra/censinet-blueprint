import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type AssessmentStatus = Database['public']['Enums']['assessment_status']
type RiskLevel = Database['public']['Enums']['risk_level']

const assessmentStatuses = [
  'draft',
  'in_progress',
  'under_review',
  'completed',
  'expired',
  'cancelled',
] as const satisfies readonly AssessmentStatus[]

const riskLevels = ['critical', 'high', 'medium', 'low', 'minimal'] as const satisfies readonly RiskLevel[]
const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const assessmentCreateSchema = z.object({
  vendor_id: z.string().uuid('vendor_id must be a valid UUID'),
  assessor_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(assessmentStatuses).optional(),
  risk_score: z.number().int().min(0).max(100).optional().nullable(),
  risk_level: z.enum(riskLevels).optional().nullable(),
  framework: z.string().trim().max(120).optional().nullable(),
  questionnaire_data: z.record(z.string(), z.unknown()).optional().nullable(),
  findings: z.array(z.record(z.string(), z.unknown())).max(1000).optional().nullable(),
  recommendations: z.array(z.record(z.string(), z.unknown())).max(1000).optional().nullable(),
  due_date: dateLikeString.optional().nullable(),
  next_review_date: dateLikeString.optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const vendor_id = searchParams.get('vendor_id')
    const risk_level = searchParams.get('risk_level')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('risk_assessments')
      .select('*, vendors(name)', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status && !assessmentStatuses.includes(status as AssessmentStatus)) {
      return errorResponse('Invalid status filter', 400)
    }

    if (risk_level && !riskLevels.includes(risk_level as RiskLevel)) {
      return errorResponse('Invalid risk_level filter', 400)
    }

    if (status) query = query.eq('status', status as AssessmentStatus)
    if (vendor_id) query = query.eq('vendor_id', vendor_id)
    if (risk_level) query = query.eq('risk_level', risk_level as RiskLevel)

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
    const parsed = assessmentCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { vendor_id, ...rest } = parsed.data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendor_id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (vendorError || !vendor) {
      return errorResponse('Vendor not found in your organization', 404)
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        ...rest,
        vendor_id,
        organization_id: auth.profile.organization_id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'assessment',
      resourceId: data.id,
      metadata: { vendor_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
