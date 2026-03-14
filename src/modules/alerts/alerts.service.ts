import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Alert = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];

interface AlertFilters {
  type?: string;
  priority?: string;
  is_read?: boolean;
  page?: number;
  per_page?: number;
}

export async function getAlerts(
  orgId: string,
  userId?: string,
  filters: AlertFilters = {}
) {
  const supabase = await createClient();
  const { type, priority, is_read, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('alerts')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (type) {
    query = query.eq('type', type as any);
  }

  if (priority) {
    query = query.eq('priority', priority as any);
  }

  if (is_read !== undefined) {
    query = query.eq('is_read', is_read);
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

export async function markAsRead(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function markAllAsRead(orgId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();

  return { data, error };
}

export async function dismissAlert(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('alerts')
    .update({
      is_dismissed: true,
      dismissed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function createAlert(data: AlertInsert) {
  const supabase = await createClient();

  const { data: alert, error } = await supabase
    .from('alerts')
    .insert(data)
    .select()
    .single();

  return { data: alert, error };
}

export async function getUnreadCount(orgId: string, userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_dismissed', false);

  return { data: { count: count ?? 0 }, error };
}
