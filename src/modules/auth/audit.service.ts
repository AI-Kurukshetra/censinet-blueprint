import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

interface AuditLogFilters {
  user_id?: string;
  resource_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}

export async function logAction(
  orgId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        organization_id: orgId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details ?? null,
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    // Audit logging should not break the main request
    console.error('Failed to log audit event:', error);
    return { data: null, error };
  }
}

export async function getAuditLogs(
  orgId: string,
  filters: AuditLogFilters = {}
) {
  const supabase = await createClient();
  const {
    user_id,
    resource_type,
    action,
    from_date,
    to_date,
    page = 1,
    per_page = 50,
  } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('audit_logs')
    .select(
      '*, user_profiles(id, first_name, last_name, email)',
      { count: 'exact' }
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  if (resource_type) {
    query = query.eq('resource_type', resource_type);
  }

  if (action) {
    query = query.eq('action', action);
  }

  if (from_date) {
    query = query.gte('created_at', from_date);
  }

  if (to_date) {
    query = query.lte('created_at', to_date);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  return {
    data,
    error,
    count,
    page,
    per_page,
    total_pages: count ? Math.ceil(count / per_page) : 0,
  };
}

// Object-style wrapper used by API routes
export async function logAuditEvent(params: {
  supabase?: unknown
  userId: string
  organizationId: string
  action: string
  resourceType: string
  resourceId: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  return logAction(
    params.organizationId,
    params.userId,
    params.action,
    params.resourceType,
    params.resourceId,
    params.metadata,
    params.ipAddress,
    params.userAgent
  );
}

export async function getAuditLogById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user_profiles(id, first_name, last_name, email)')
    .eq('id', id)
    .single();

  return { data, error };
}
