import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type BaaStatus = Database['public']['Enums']['baa_status']
const baaStatuses = [
  'draft',
  'pending_review',
  'pending_signature',
  'active',
  'expired',
  'terminated',
  'amended',
] as const satisfies readonly BaaStatus[]

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const baaCreateSchema = z.object({
  vendor_id: z.string().uuid('vendor_id must be a valid UUID'),
  contract_id: z.string().uuid().optional().nullable(),
  status: z.enum(baaStatuses).optional(),
  version: z.number().int().positive().optional(),
  effective_date: dateLikeString.optional().nullable(),
  expiration_date: dateLikeString.optional().nullable(),
  phi_scope: z.string().trim().max(2000).optional().nullable(),
  safeguards: z.record(z.string(), z.unknown()).optional().nullable(),
  breach_notification_terms: z.record(z.string(), z.unknown()).optional().nullable(),
  termination_terms: z.record(z.string(), z.unknown()).optional().nullable(),
  document_url: z.string().trim().url('document_url must be a valid URL').optional().nullable(),
  signed_by_org: z.string().trim().max(160).optional().nullable(),
  signed_by_vendor: z.string().trim().max(160).optional().nullable(),
  signed_at: dateLikeString.optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const vendor_id = searchParams.get('vendor_id')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('business_associate_agreements')
      .select('*, vendors(name)', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status && !baaStatuses.includes(status as BaaStatus)) {
      return errorResponse('Invalid status filter', 400)
    }

    if (status) query = query.eq('status', status as BaaStatus)
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
    const parsed = baaCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const { vendor_id, contract_id, ...rest } = parsed.data
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendor_id)
      .eq('organization_id', auth.profile.organization_id)
      .single()
    if (vendorError || !vendor) {
      return errorResponse('Vendor not found in your organization', 404)
    }

    if (contract_id) {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('id', contract_id)
        .eq('organization_id', auth.profile.organization_id)
        .single()
      if (contractError || !contract) {
        return errorResponse('Contract not found in your organization', 404)
      }
    }

    const { data, error } = await supabase
      .from('business_associate_agreements')
      .insert({
        ...rest,
        vendor_id,
        contract_id: contract_id ?? null,
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
      resourceType: 'baa',
      resourceId: data.id,
      metadata: { vendor_id, contract_id: contract_id ?? null },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
