import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import { z } from 'zod'
import type { Database } from '@/types/database'

type DocumentType = Database['public']['Enums']['document_type']

const documentTypes = [
  'policy',
  'procedure',
  'certificate',
  'audit_report',
  'baa',
  'contract',
  'soc2_report',
  'penetration_test',
  'risk_assessment',
  'insurance',
  'other',
] as const satisfies readonly DocumentType[]

const dateLikeString = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date format',
})

const documentCreateSchema = z.object({
  vendor_id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, 'name is required').max(240),
  description: z.string().trim().max(5000).optional().nullable(),
  document_type: z.enum(documentTypes).optional(),
  file_url: z.string().trim().url('file_url must be a valid URL'),
  file_size: z.number().int().min(0).optional().nullable(),
  mime_type: z.string().trim().max(120).optional().nullable(),
  version: z.number().int().positive().optional(),
  tags: z.array(z.string().trim().min(1)).max(100).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  expires_at: dateLikeString.optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const vendor_id = searchParams.get('vendor_id')
    const document_type = searchParams.get('document_type')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (vendor_id) query = query.eq('vendor_id', vendor_id)
    if (document_type && !documentTypes.includes(document_type as DocumentType)) {
      return errorResponse('Invalid document_type filter', 400)
    }

    if (document_type) query = query.eq('document_type', document_type as DocumentType)

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
    const parsed = documentCreateSchema.safeParse(body)
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
      .from('documents')
      .insert({
        ...rest,
        vendor_id: vendor_id ?? null,
        organization_id: auth.profile.organization_id,
        uploaded_by: auth.user.id,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'document',
      resourceId: data.id,
      metadata: { document_type: data.document_type, vendor_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
