import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { errorResponse, getAuthContext, successResponse, unauthorizedResponse } from '@/lib/api-utils'
import { logAuditEvent } from '@/modules/auth/audit.service'

const MAX_FILE_SIZE = 25 * 1024 * 1024

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) return unauthorizedResponse()

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return errorResponse('file is required', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File exceeds 25MB limit', 400)
    }

    const name = String(form.get('name') ?? '').trim()
    if (!name) {
      return errorResponse('name is required', 400)
    }

    const vendor_id_raw = String(form.get('vendor_id') ?? '').trim()
    const vendor_id = vendor_id_raw.length > 0 ? vendor_id_raw : null
    const document_type = String(form.get('document_type') ?? 'other').trim() || 'other'
    const description = String(form.get('description') ?? '').trim() || null
    const expires_at_raw = String(form.get('expires_at') ?? '').trim()
    const expires_at = expires_at_raw.length > 0 ? expires_at_raw : null
    const tagsRaw = String(form.get('tags') ?? '[]')
    const tags = JSON.parse(tagsRaw) as string[]

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

    const admin = createAdminClient()
    const storagePath = `${auth.profile.organization_id}/${Date.now()}-${sanitizeFileName(file.name)}`
    const { error: uploadError } = await admin.storage.from('documents').upload(storagePath, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

    if (uploadError) {
      return errorResponse(uploadError.message)
    }

    const { data: publicUrlData } = admin.storage.from('documents').getPublicUrl(storagePath)
    const file_url = publicUrlData.publicUrl

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: auth.profile.organization_id,
        vendor_id,
        uploaded_by: auth.user.id,
        name,
        description,
        document_type: document_type as never,
        file_url,
        file_size: file.size,
        mime_type: file.type || null,
        tags: Array.isArray(tags) ? tags : null,
        expires_at,
      })
      .select()
      .single()

    if (error) return errorResponse(error.message)

    await logAuditEvent({
      supabase,
      userId: auth.user.id,
      organizationId: auth.profile.organization_id,
      action: 'upload',
      resourceType: 'document',
      resourceId: data.id,
      metadata: { document_type: data.document_type, vendor_id },
    })

    return successResponse(data, 201)
  } catch (err: unknown) {
    return errorResponse(err instanceof Error ? err.message : 'Unexpected error')
  }
}
