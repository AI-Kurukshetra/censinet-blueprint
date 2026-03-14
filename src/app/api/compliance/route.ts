import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type ComplianceStatus = Database['public']['Enums']['compliance_status']
const complianceStatuses = [
  'compliant',
  'non_compliant',
  'partially_compliant',
  'not_assessed',
  'in_remediation',
  'waived',
] as const satisfies readonly ComplianceStatus[]

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const complianceCreateSchema = z.object({
  vendor_id: z.string().uuid().optional().nullable(),
  framework_id: z.string().uuid('framework_id must be a valid UUID'),
  requirement_key: z.string().trim().min(1, 'requirement_key is required').max(120),
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(complianceStatuses).optional(),
  evidence_url: z.string().trim().url('evidence_url must be a valid URL').optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  due_date: dateLikeString.optional().nullable(),
  completed_at: dateLikeString.optional().nullable(),
})

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

    if (status && !complianceStatuses.includes(status as ComplianceStatus)) {
      return errorResponse('Invalid status filter', 400)
    }

    if (status) query = query.eq('status', status as ComplianceStatus)
    if (framework) query = query.eq('framework_id', framework)
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
    const parsed = complianceCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { vendor_id, framework_id, ...rest } = parsed.data

    const { data: frameworkRow, error: frameworkError } = await supabase
      .from('compliance_frameworks')
      .select('id')
      .eq('id', framework_id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (frameworkError || !frameworkRow) {
      return errorResponse('Framework not found in your organization', 404)
    }

    if (vendor_id) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', vendor_id)
        .eq('organization_id', auth.profile.organization_id)
        .single()
      if (vendorError || !vendor) {
        return errorResponse('Vendor not found in your organization', 404)
      }
    }

    const { data, error } = await supabase
      .from('compliance_items')
      .insert({
        ...rest,
        vendor_id: vendor_id ?? null,
        framework_id,
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
      resourceType: 'compliance_item',
      resourceId: data.id,
      metadata: { framework_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
