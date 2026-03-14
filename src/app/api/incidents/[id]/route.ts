import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
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

const incidentUpdateSchema = z.object({
  vendor_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200).optional(),
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

const incidentUpdateCreateSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(10000),
  is_internal: z.boolean().optional(),
})

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
      .from('incidents')
      .select('*, vendors(name), incident_updates(*)')
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
    const parsed = incidentUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }
    if (Object.keys(parsed.data).length === 0) {
      return errorResponse('No valid fields provided for update', 400)
    }

    if (parsed.data.vendor_id) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', parsed.data.vendor_id)
        .eq('organization_id', auth.profile.organization_id)
        .single()
      if (vendorError || !vendor) {
        return errorResponse('Vendor not found in your organization', 404)
      }
    }

    const { data, error } = await supabase
      .from('incidents')
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
      resourceType: 'incident',
      resourceId: id,
      metadata: { fields: Object.keys(parsed.data) },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
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
    const body = await request.json() as unknown
    const parsed = incidentUpdateCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
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
        content: parsed.data.content,
        is_internal: parsed.data.is_internal ?? false,
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
      metadata: { incident_id: id, is_internal: parsed.data.is_internal ?? false },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
