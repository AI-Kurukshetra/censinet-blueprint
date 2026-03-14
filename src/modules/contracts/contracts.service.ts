import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractInsert = Database['public']['Tables']['contracts']['Insert'];
type ContractUpdate = Database['public']['Tables']['contracts']['Update'];
type BAA = Database['public']['Tables']['business_associate_agreements']['Row'];
type BAAInsert = Database['public']['Tables']['business_associate_agreements']['Insert'];
type BAAUpdate = Database['public']['Tables']['business_associate_agreements']['Update'];

interface ContractFilters {
  vendor_id?: string;
  status?: string;
  contract_type?: string;
  page?: number;
  per_page?: number;
}

interface BAAFilters {
  vendor_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export async function getContracts(
  orgId: string,
  filters: ContractFilters = {}
) {
  const supabase = await createClient();
  const { vendor_id, status, contract_type, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('contracts')
    .select('*, vendors(id, name)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (status) {
    query = query.eq('status', status as any);
  }

  if (contract_type) {
    query = query.eq('contract_type', contract_type);
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

export async function getContractById(id: string) {
  const supabase = await createClient();

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, vendors(id, name, status)')
    .eq('id', id)
    .single();

  if (contractError) {
    return { data: null, error: contractError };
  }

  const { data: baa } = await supabase
    .from('business_associate_agreements')
    .select('*')
    .eq('contract_id', id)
    .maybeSingle();

  return {
    data: {
      ...contract,
      baa: baa ?? null,
    },
    error: null,
  };
}

export async function createContract(data: ContractInsert) {
  const supabase = await createClient();

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert(data)
    .select()
    .single();

  return { data: contract, error };
}

export async function updateContract(id: string, data: ContractUpdate) {
  const supabase = await createClient();

  const { data: contract, error } = await supabase
    .from('contracts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: contract, error };
}

export async function getBAAs(orgId: string, filters: BAAFilters = {}) {
  const supabase = await createClient();
  const { vendor_id, status, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('business_associate_agreements')
    .select('*, vendors(id, name), contracts(id, title)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
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

export async function getBAA(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('business_associate_agreements')
    .select('*, vendors(id, name, status), contracts(id, title, status)')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function createBAA(data: BAAInsert) {
  const supabase = await createClient();

  const { data: baa, error } = await supabase
    .from('business_associate_agreements')
    .insert(data)
    .select()
    .single();

  return { data: baa, error };
}

export async function updateBAA(id: string, data: BAAUpdate) {
  const supabase = await createClient();

  const { data: baa, error } = await supabase
    .from('business_associate_agreements')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: baa, error };
}

export async function getExpiringContracts(
  orgId: string,
  withinDays: number = 90
) {
  const supabase = await createClient();

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + withinDays);

  const { data, error } = await supabase
    .from('contracts')
    .select('*, vendors(id, name)')
    .eq('organization_id', orgId)
    .gte('end_date', now.toISOString())
    .lte('end_date', futureDate.toISOString())
    .order('end_date', { ascending: true });

  return { data, error };
}
