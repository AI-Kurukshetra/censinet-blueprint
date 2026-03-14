import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Vendor = Database['public']['Tables']['vendors']['Row'];
type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

interface VendorFilters {
  status?: string;
  risk_level?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getVendors(orgId: string, filters: VendorFilters = {}) {
  const supabase = await createClient();
  const { status, risk_level, search, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status as any);
  }

  if (risk_level) {
    query = query.eq('risk_level', risk_level as any);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
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

export async function getVendorById(id: string) {
  const supabase = await createClient();

  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .single();

  if (vendorError) {
    return { data: null, error: vendorError };
  }

  const [assessments, contracts] = await Promise.all([
    supabase
      .from('risk_assessments')
      .select('*')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contracts')
      .select('*')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return {
    data: {
      ...vendor,
      recent_assessments: assessments.data ?? [],
      recent_contracts: contracts.data ?? [],
    },
    error: null,
  };
}

export async function createVendor(data: VendorInsert) {
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert(data)
    .select()
    .single();

  return { data: vendor, error };
}

export async function updateVendor(id: string, data: VendorUpdate) {
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: vendor, error };
}

export async function deleteVendor(id: string) {
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data: vendor, error };
}

export async function getVendorStats(orgId: string) {
  const supabase = await createClient();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('status, risk_level')
    .eq('organization_id', orgId);

  if (error) {
    return { data: null, error };
  }

  const statusCounts: Record<string, number> = {};
  const riskLevelCounts: Record<string, number> = {};

  for (const vendor of vendors ?? []) {
    const s = vendor.status ?? 'unknown';
    const r = vendor.risk_level ?? 'unknown';
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    riskLevelCounts[r] = (riskLevelCounts[r] ?? 0) + 1;
  }

  return {
    data: {
      total: vendors?.length ?? 0,
      by_status: statusCounts,
      by_risk_level: riskLevelCounts,
    },
    error: null,
  };
}

export async function searchVendors(orgId: string, query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('organization_id', orgId)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(50);

  return { data, error };
}
