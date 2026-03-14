import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
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

const assessmentUpdateSchema = z.object({
  vendor_id: z.string().uuid().optional(),
  assessor_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200).optional(),
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

const assessmentActionSchema = z.object({
  action: z.enum(['submit', 'complete']),
  risk_score: z.number().int().min(0).max(100).optional(),
  risk_level: z.enum(riskLevels).optional(),
})

function mapScoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low'
  return 'minimal'
}

export async function GET(
  _request: NextRequest,
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
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
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
    const body = await request.json() as unknown
    const parsed = assessmentUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    if (Object.keys(parsed.data).length === 0) {
      return errorResponse('No valid fields provided for update', 400)
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
      metadata: { fields: Object.keys(parsed.data) },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
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
    const body = await request.json() as unknown
    const parsed = assessmentActionSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { action } = parsed.data

    const updateData: Database['public']['Tables']['risk_assessments']['Update'] = {
      updated_at: new Date().toISOString(),
    }

    if (action === 'submit') {
      updateData.status = 'under_review'
    } else if (action === 'complete') {
      const riskScore = parsed.data.risk_score
      if (typeof riskScore === 'number') {
        updateData.risk_score = riskScore
        updateData.risk_level = parsed.data.risk_level ?? mapScoreToRiskLevel(riskScore)
      }
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
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
      action,
      resourceType: 'assessment',
      resourceId: id,
      metadata: { action },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
