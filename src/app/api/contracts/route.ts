import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type ContractStatus = Database['public']['Enums']['contract_status']

const contractStatuses = [
  'draft',
  'pending_review',
  'active',
  'expired',
  'terminated',
  'renewed',
] as const satisfies readonly ContractStatus[]

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const contractCreateSchema = z.object({
  vendor_id: z.string().uuid('vendor_id must be a valid UUID'),
  title: z.string().trim().min(1, 'Title is required').max(200),
  contract_type: z.string().trim().max(120).optional().nullable(),
  status: z.enum(contractStatuses).optional(),
  start_date: dateLikeString.optional().nullable(),
  end_date: dateLikeString.optional().nullable(),
  renewal_date: dateLikeString.optional().nullable(),
  value: z.number().nonnegative().optional().nullable(),
  auto_renew: z.boolean().optional(),
  terms: z.record(z.string(), z.unknown()).optional().nullable(),
  document_url: z.string().trim().url('document_url must be a valid URL').optional().nullable(),
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
      .from('contracts')
      .select('*, vendors(name)', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status && !contractStatuses.includes(status as ContractStatus)) {
      return errorResponse('Invalid status filter', 400)
    }

    if (status) query = query.eq('status', status as ContractStatus)
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
    const parsed = contractCreateSchema.safeParse(body)
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
      .from('contracts')
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
      resourceType: 'contract',
      resourceId: data.id,
      metadata: { vendor_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
