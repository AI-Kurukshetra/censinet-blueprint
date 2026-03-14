import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
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

const contractUpdateSchema = z.object({
  vendor_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200).optional(),
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
      .from('contracts')
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
    const parsed = contractUpdateSchema.safeParse(body)
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
      .from('contracts')
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
      resourceType: 'contract',
      resourceId: id,
      metadata: { fields: Object.keys(parsed.data) },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
