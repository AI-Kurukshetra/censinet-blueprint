import { NextResponse } from 'next/server'

export interface AuthContext {
  user: {
    id: string
    email?: string
  }
  profile: {
    organization_id: string
    role: string
  }
}

export async function getAuthContext(supabase: any): Promise<AuthContext | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { user, profile }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10)
  const rawPerPage = parseInt(searchParams.get('per_page') || '20', 10)
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage)
  const per_page = Math.min(100, Math.max(1, isNaN(rawPerPage) ? 20 : rawPerPage))
  const offset = (page - 1) * per_page
  return { page, per_page, offset }
}
