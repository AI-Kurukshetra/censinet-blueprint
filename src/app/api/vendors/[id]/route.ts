import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import type { Database } from '@/types/database'
import { z } from 'zod'

type VendorUpdate = Database['public']['Tables']['vendors']['Update']
type VendorStatus = Database['public']['Enums']['vendor_status']
type RiskLevel = Database['public']['Enums']['risk_level']

const vendorStatuses = [
  'active',
  'inactive',
  'pending_review',
  'onboarding',
  'offboarding',
  'suspended',
  'archived',
] as const satisfies readonly VendorStatus[]

const riskLevels = ['critical', 'high', 'medium', 'low', 'minimal'] as const satisfies readonly RiskLevel[]

const vendorUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  website: z.string().trim().url('Website must be a valid URL').optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  status: z.enum(vendorStatuses).optional(),
  risk_level: z.enum(riskLevels).optional().nullable(),
  risk_score: z.number().int().min(0).max(100).optional().nullable(),
  primary_contact_name: z.string().trim().max(120).optional().nullable(),
  primary_contact_email: z.string().trim().email('Primary contact email is invalid').optional().nullable(),
  primary_contact_phone: z.string().trim().max(50).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  state: z.string().trim().max(120).optional().nullable(),
  zip_code: z.string().trim().max(30).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  hipaa_compliant: z.boolean().optional(),
  soc2_certified: z.boolean().optional(),
  hitrust_certified: z.boolean().optional(),
  phi_access: z.boolean().optional(),
  data_classification: z.array(z.string().trim().min(1)).max(50).optional().nullable(),
  data_types_shared: z.array(z.string().trim().min(1)).max(50).optional().nullable(),
})

function normalizeNullableText(value: unknown): string | null | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeTextArray(value: unknown): string[] | null | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.filter((item): item is string => typeof item === 'string')
  return items.length > 0 ? items : null
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildUpdatePayload(body: Record<string, unknown>): VendorUpdate {
  const payload: VendorUpdate = {}

  if (typeof body.name === 'string' && body.name.trim().length > 0) {
    payload.name = body.name.trim()
  }

  const description = normalizeNullableText(body.description)
  if (description !== undefined) payload.description = description

  const website = normalizeNullableText(body.website)
  if (website !== undefined) payload.website = website

  const category = normalizeNullableText(body.category)
  if (category !== undefined) payload.category = category

  if (typeof body.status === 'string' && body.status.trim().length > 0) {
    payload.status = body.status.trim() as VendorUpdate['status']
  }

  if (typeof body.risk_level === 'string' && body.risk_level.trim().length > 0) {
    payload.risk_level = body.risk_level.trim() as VendorUpdate['risk_level']
  } else if (body.risk_level === null) {
    payload.risk_level = null
  }

  const primaryContactName = normalizeNullableText(body.primary_contact_name)
  if (primaryContactName !== undefined) payload.primary_contact_name = primaryContactName

  const primaryContactEmail = normalizeNullableText(body.primary_contact_email)
  if (primaryContactEmail !== undefined) payload.primary_contact_email = primaryContactEmail

  const primaryContactPhone = normalizeNullableText(body.primary_contact_phone)
  if (primaryContactPhone !== undefined) payload.primary_contact_phone = primaryContactPhone

  const address = normalizeNullableText(body.address)
  if (address !== undefined) payload.address = address

  const city = normalizeNullableText(body.city)
  if (city !== undefined) payload.city = city

  const state = normalizeNullableText(body.state)
  if (state !== undefined) payload.state = state

  const zipCode = normalizeNullableText(body.zip_code)
  if (zipCode !== undefined) payload.zip_code = zipCode

  const country = normalizeNullableText(body.country)
  if (country !== undefined) payload.country = country

  if (typeof body.slug === 'string' && body.slug.trim().length > 0) {
    payload.slug = slugify(body.slug)
  }

  if (typeof body.risk_score === 'number') payload.risk_score = body.risk_score
  else if (body.risk_score === null) payload.risk_score = null
  if (typeof body.hipaa_compliant === 'boolean') payload.hipaa_compliant = body.hipaa_compliant
  if (typeof body.soc2_certified === 'boolean') payload.soc2_certified = body.soc2_certified
  if (typeof body.hitrust_certified === 'boolean') payload.hitrust_certified = body.hitrust_certified
  if (typeof body.phi_access === 'boolean') payload.phi_access = body.phi_access

  const dataClassification = normalizeTextArray(body.data_classification)
  const dataTypesShared = normalizeTextArray(body.data_types_shared)
  if (body.data_classification === null || body.data_types_shared === null) {
    payload.data_classification = null
  } else if (dataClassification !== undefined || dataTypesShared !== undefined) {
    payload.data_classification = dataClassification
      ?? dataTypesShared
  }

  return payload
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

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*, risk_assessments(*)')
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .single()

    if (error) return errorResponse(error.message, 404)

    return successResponse(vendor)
  } catch (err: unknown) {
    return errorResponse(getErrorMessage(err))
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
    const parsed = vendorUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const payload = buildUpdatePayload(parsed.data as Record<string, unknown>)
    if (Object.keys(payload).length === 0) {
      return errorResponse('No valid fields provided for update', 400)
    }

    const { data, error } = await supabase
      .from('vendors')
      .update({ ...payload, updated_at: new Date().toISOString() })
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
      resourceType: 'vendor',
      resourceId: id,
      metadata: { fields: Object.keys(parsed.data) },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(getErrorMessage(err))
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { id } = await params

    const { data, error } = await supabase
      .from('vendors')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', auth.profile.organization_id)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'delete',
      resourceType: 'vendor',
      resourceId: id,
      metadata: { soft_delete: true },
    })

    return successResponse(data)
  } catch (err: unknown) {
    return errorResponse(getErrorMessage(err))
  }
}
