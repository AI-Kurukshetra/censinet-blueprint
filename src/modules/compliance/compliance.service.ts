import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type ComplianceItem = Database['public']['Tables']['compliance_items']['Row'];
type ComplianceItemInsert = Database['public']['Tables']['compliance_items']['Insert'];
type ComplianceItemUpdate = Database['public']['Tables']['compliance_items']['Update'];

interface ComplianceFilters {
  framework_id?: string;
  vendor_id?: string;
  status?: string;
}

export async function getComplianceFrameworks(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_frameworks')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  return { data, error };
}

export async function getComplianceItems(
  orgId: string,
  filters: ComplianceFilters = {}
) {
  const supabase = await createClient();
  const { framework_id, vendor_id, status } = filters;

  let query = supabase
    .from('compliance_items')
    .select(
      '*, compliance_frameworks(id, name, version), vendors(id, name)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (framework_id) {
    query = query.eq('framework_id', framework_id);
  }

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (status) {
    query = query.eq('status', status as any);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getComplianceItemById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_items')
    .select(
      '*, compliance_frameworks(id, name, version), vendors(id, name)'
    )
    .eq('id', id)
    .single();

  return { data, error };
}

export async function createComplianceItem(data: ComplianceItemInsert) {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('compliance_items')
    .insert(data)
    .select()
    .single();

  return { data: item, error };
}

export async function updateComplianceItem(
  id: string,
  data: ComplianceItemUpdate
) {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('compliance_items')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: item, error };
}

export async function getComplianceSummary(orgId: string) {
  const supabase = await createClient();

  const { data: frameworks, error: frameworksError } = await supabase
    .from('compliance_frameworks')
    .select('id, name')
    .eq('organization_id', orgId);

  if (frameworksError || !frameworks) {
    return { data: null, error: frameworksError };
  }

  const summaries = await Promise.all(
    frameworks.map(async (framework) => {
      const { data: items, error } = await supabase
        .from('compliance_items')
        .select('status')
        .eq('organization_id', orgId)
        .eq('framework_id', framework.id);

      if (error || !items) {
        return {
          framework_id: framework.id,
          framework_name: framework.name,
          total: 0,
          compliant: 0,
          non_compliant: 0,
          in_progress: 0,
          compliance_percentage: 0,
        };
      }

      const total = items.length;
      const compliant = items.filter((i) => i.status === 'compliant').length;
      const nonCompliant = items.filter(
        (i) => i.status === 'non_compliant'
      ).length;
      const inProgress = items.filter(
        (i) => i.status === 'partially_compliant' || i.status === 'in_remediation'
      ).length;

      return {
        framework_id: framework.id,
        framework_name: framework.name,
        total,
        compliant,
        non_compliant: nonCompliant,
        in_progress: inProgress,
        compliance_percentage: total > 0 ? Math.round((compliant / total) * 100) : 0,
      };
    })
  );

  return { data: summaries, error: null };
}

export async function getVendorCompliance(vendorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_items')
    .select(
      '*, compliance_frameworks(id, name, version)'
    )
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  return { data, error };
}
