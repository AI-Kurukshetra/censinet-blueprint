import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse, getPaginationParams } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'
import type { Database } from '@/types/database'
import { z } from 'zod'

type VendorInsert = Database['public']['Tables']['vendors']['Insert']
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

const vendorCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  website: z.string().trim().url('Website must be a valid URL').optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  status: z.enum(vendorStatuses).optional(),
  risk_level: z.enum(riskLevels).optional().nullable(),
  risk_score: z.number().int().min(0).max(100).optional(),
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

function buildInsertPayload(body: Record<string, unknown>, organizationId: string): VendorInsert {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const requestedSlug = typeof body.slug === 'string' ? body.slug : name
  const slug = slugify(requestedSlug) || `vendor-${Date.now()}`

  const payload: VendorInsert = {
    organization_id: organizationId,
    name,
    slug,
  }

  const description = normalizeNullableText(body.description)
  if (description !== undefined) payload.description = description

  const website = normalizeNullableText(body.website)
  if (website !== undefined) payload.website = website

  const category = normalizeNullableText(body.category)
  if (category !== undefined) payload.category = category

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

  const status = normalizeNullableText(body.status)
  if (status !== undefined && status !== null) payload.status = status as VendorInsert['status']

  const riskLevel = normalizeNullableText(body.risk_level)
  if (riskLevel !== undefined) payload.risk_level = riskLevel as VendorInsert['risk_level']

  if (typeof body.risk_score === 'number') payload.risk_score = body.risk_score

  if (typeof body.hipaa_compliant === 'boolean') payload.hipaa_compliant = body.hipaa_compliant
  if (typeof body.soc2_certified === 'boolean') payload.soc2_certified = body.soc2_certified
  if (typeof body.hitrust_certified === 'boolean') payload.hitrust_certified = body.hitrust_certified
  if (typeof body.phi_access === 'boolean') payload.phi_access = body.phi_access

  const dataClassification =
    normalizeTextArray(body.data_classification) ??
    normalizeTextArray(body.data_types_shared)

  if (dataClassification !== undefined) {
    payload.data_classification = dataClassification
  }

  return payload
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const risk_level = searchParams.get('risk_level')
    const search = searchParams.get('search')
    const { page, per_page, offset } = getPaginationParams(searchParams)

    let query = supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.profile.organization_id)

    if (status && !vendorStatuses.includes(status as VendorStatus)) {
      return errorResponse('Invalid status filter', 400)
    }

    if (risk_level && !riskLevels.includes(risk_level as RiskLevel)) {
      return errorResponse('Invalid risk_level filter', 400)
    }

    if (status) {
      query = query.eq('status', status as Database['public']['Enums']['vendor_status'])
    }

    if (risk_level) {
      query = query.eq('risk_level', risk_level as Database['public']['Enums']['risk_level'])
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

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
    return errorResponse(getErrorMessage(err))
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const body = await request.json() as unknown
    const parsed = vendorCreateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid payload', 400)
    }

    const payload = buildInsertPayload(parsed.data as Record<string, unknown>, auth.profile.organization_id)

    const { data, error } = await supabase
      .from('vendors')
      .insert(payload)
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'create',
      resourceType: 'vendor',
      resourceId: data.id,
      metadata: { name: parsed.data.name },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(getErrorMessage(err))
  }
}
