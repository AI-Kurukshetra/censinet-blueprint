import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type IncidentStatus = Database['public']['Enums']['incident_status']
type IncidentSeverity = Database['public']['Enums']['incident_severity']

const incidentStatuses = [
  'reported',
  'investigating',
  'contained',
  'remediation',
  'resolved',
  'closed',
] as const satisfies readonly IncidentStatus[]

const incidentSeverities = ['critical', 'high', 'medium', 'low'] as const satisfies readonly IncidentSeverity[]

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const incidentCreateSchema = z.object({
  vendor_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(10000).optional().nullable(),
  severity: z.enum(incidentSeverities).optional(),
  status: z.enum(incidentStatuses).optional(),
  category: z.string().trim().max(120).optional().nullable(),
  affected_systems: z.array(z.string().trim().min(1)).max(100).optional().nullable(),
  phi_compromised: z.boolean().optional(),
  individuals_affected: z.number().int().min(0).optional().nullable(),
  root_cause: z.string().trim().max(5000).optional().nullable(),
  resolution: z.string().trim().max(5000).optional().nullable(),
  timeline: z.array(z.record(z.string(), z.unknown())).max(1000).optional().nullable(),
  reported_at: dateLikeString.optional(),
  resolved_at: dateLikeString.optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const vendor_id = searchParams.get('vendor_id')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('incidents')
      .select('*, vendors(name)', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status && !incidentStatuses.includes(status as IncidentStatus)) {
      return errorResponse('Invalid status filter', 400)
    }
    if (severity && !incidentSeverities.includes(severity as IncidentSeverity)) {
      return errorResponse('Invalid severity filter', 400)
    }

    if (status) query = query.eq('status', status as IncidentStatus)
    if (severity) query = query.eq('severity', severity as IncidentSeverity)
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
    const parsed = incidentCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { vendor_id, ...rest } = parsed.data
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
      .from('incidents')
      .insert({
        ...rest,
        vendor_id: vendor_id ?? null,
        organization_id: auth.profile.organization_id,
        reported_by: auth.user.id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'incident',
      resourceId: data.id,
      metadata: { severity: data.severity, vendor_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
