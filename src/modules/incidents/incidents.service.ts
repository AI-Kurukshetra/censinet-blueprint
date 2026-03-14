import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Incident = Database['public']['Tables']['incidents']['Row'];
type IncidentInsert = Database['public']['Tables']['incidents']['Insert'];
type IncidentUpdate = Database['public']['Tables']['incidents']['Update'];
type IncidentUpdateEntry = Database['public']['Tables']['incident_updates']['Row'];
type IncidentUpdateInsert = Database['public']['Tables']['incident_updates']['Insert'];

interface IncidentFilters {
  vendor_id?: string;
  severity?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export async function getIncidents(
  orgId: string,
  filters: IncidentFilters = {}
) {
  const supabase = await createClient();
  const { vendor_id, severity, status, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('incidents')
    .select('*, vendors(id, name)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (severity) {
    query = query.eq('severity', severity as any);
  }

  if (status) {
    query = query.eq('status', status as any);
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

export async function getIncidentById(id: string) {
  const supabase = await createClient();

  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('*, vendors(id, name, status)')
    .eq('id', id)
    .single();

  if (incidentError) {
    return { data: null, error: incidentError };
  }

  const { data: updates, error: updatesError } = await supabase
    .from('incident_updates')
    .select('*, user_profiles(id, first_name, last_name)')
    .eq('incident_id', id)
    .order('created_at', { ascending: true });

  if (updatesError) {
    return { data: null, error: updatesError };
  }

  return {
    data: {
      ...incident,
      updates: updates ?? [],
    },
    error: null,
  };
}

export async function createIncident(data: IncidentInsert) {
  const supabase = await createClient();

  const { data: incident, error } = await supabase
    .from('incidents')
    .insert(data)
    .select()
    .single();

  return { data: incident, error };
}

export async function updateIncident(id: string, data: IncidentUpdate) {
  const supabase = await createClient();

  const { data: incident, error } = await supabase
    .from('incidents')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: incident, error };
}

export async function addIncidentUpdate(
  incidentId: string,
  userId: string,
  content: string,
  isInternal: boolean
) {
  const supabase = await createClient();

  const { data: update, error } = await supabase
    .from('incident_updates')
    .insert({
      incident_id: incidentId,
      user_id: userId,
      content,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  // Also update the incident's updated_at timestamp
  await supabase
    .from('incidents')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', incidentId);

  return { data: update, error: null };
}

export async function getIncidentStats(orgId: string) {
  const supabase = await createClient();

  const { data: incidents, error } = await supabase
    .from('incidents')
    .select('severity, status')
    .eq('organization_id', orgId);

  if (error) {
    return { data: null, error };
  }

  const severityCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  for (const incident of incidents ?? []) {
    const sev = incident.severity ?? 'unknown';
    const st = incident.status ?? 'unknown';
    severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
    statusCounts[st] = (statusCounts[st] ?? 0) + 1;
  }

  return {
    data: {
      total: incidents?.length ?? 0,
      by_severity: severityCounts,
      by_status: statusCounts,
    },
    error: null,
  };
}
