import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type RiskAssessment = Database['public']['Tables']['risk_assessments']['Row'];
type RiskAssessmentInsert = Database['public']['Tables']['risk_assessments']['Insert'];
type RiskAssessmentUpdate = Database['public']['Tables']['risk_assessments']['Update'];
type RemediationTask = Database['public']['Tables']['remediation_tasks']['Row'];
type RemediationTaskInsert = Database['public']['Tables']['remediation_tasks']['Insert'];
type RemediationTaskUpdate = Database['public']['Tables']['remediation_tasks']['Update'];

interface AssessmentFilters {
  status?: string;
  vendor_id?: string;
  risk_level?: string;
  page?: number;
  per_page?: number;
}

interface RemediationFilters {
  status?: string;
  vendor_id?: string;
  assessment_id?: string;
  priority?: string;
  page?: number;
  per_page?: number;
}

export async function getAssessments(
  orgId: string,
  filters: AssessmentFilters = {}
) {
  const supabase = await createClient();
  const { status, vendor_id, risk_level, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('risk_assessments')
    .select('*, vendors(id, name, risk_level)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status as any);
  }

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (risk_level) {
    query = query.eq('risk_level', risk_level as any);
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

export async function getAssessmentById(id: string) {
  const supabase = await createClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from('risk_assessments')
    .select('*, vendors(id, name, risk_level, status)')
    .eq('id', id)
    .single();

  if (assessmentError) {
    return { data: null, error: assessmentError };
  }

  const { data: responses, error: responsesError } = await supabase
    .from('assessment_responses')
    .select('*')
    .eq('assessment_id', id)
    .order('question_order', { ascending: true });

  if (responsesError) {
    return { data: null, error: responsesError };
  }

  return {
    data: {
      ...assessment,
      responses: responses ?? [],
    },
    error: null,
  };
}

export async function createAssessment(data: RiskAssessmentInsert) {
  const supabase = await createClient();

  const { data: assessment, error } = await supabase
    .from('risk_assessments')
    .insert(data)
    .select()
    .single();

  return { data: assessment, error };
}

export async function updateAssessment(id: string, data: RiskAssessmentUpdate) {
  const supabase = await createClient();

  const { data: assessment, error } = await supabase
    .from('risk_assessments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: assessment, error };
}

export async function submitAssessment(id: string) {
  const supabase = await createClient();

  const { data: assessment, error } = await supabase
    .from('risk_assessments')
    .update({
      status: 'under_review',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data: assessment, error };
}

export async function completeAssessment(
  id: string,
  riskScore: number,
  findings: string,
  recommendations: string
) {
  const supabase = await createClient();

  let riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  if (riskScore >= 80) {
    riskLevel = 'critical';
  } else if (riskScore >= 60) {
    riskLevel = 'high';
  } else if (riskScore >= 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  const { data: assessment, error } = await supabase
    .from('risk_assessments')
    .update({
      status: 'completed',
      risk_score: riskScore,
      risk_level: riskLevel,
      findings: findings as any,
      recommendations: recommendations as any,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data: assessment, error };
}

export function getAssessmentTemplates() {
  return {
    data: [
      {
        id: 'hipaa',
        name: 'HIPAA Security Risk Assessment',
        framework: 'HIPAA',
        description:
          'Assessment based on HIPAA Security Rule requirements for electronic protected health information (ePHI).',
        questions: [
          { order: 1, category: 'Administrative Safeguards', question: 'Does the vendor have a designated security officer?', weight: 3 },
          { order: 2, category: 'Administrative Safeguards', question: 'Does the vendor conduct regular risk assessments?', weight: 3 },
          { order: 3, category: 'Administrative Safeguards', question: 'Does the vendor have workforce security policies including termination procedures?', weight: 2 },
          { order: 4, category: 'Administrative Safeguards', question: 'Does the vendor provide security awareness training to employees?', weight: 2 },
          { order: 5, category: 'Administrative Safeguards', question: 'Does the vendor have an incident response plan?', weight: 3 },
          { order: 6, category: 'Physical Safeguards', question: 'Does the vendor have facility access controls?', weight: 2 },
          { order: 7, category: 'Physical Safeguards', question: 'Does the vendor have workstation security policies?', weight: 2 },
          { order: 8, category: 'Technical Safeguards', question: 'Does the vendor implement access controls and unique user identification?', weight: 3 },
          { order: 9, category: 'Technical Safeguards', question: 'Does the vendor implement audit controls and logging?', weight: 3 },
          { order: 10, category: 'Technical Safeguards', question: 'Does the vendor use encryption for data at rest and in transit?', weight: 3 },
        ],
      },
      {
        id: 'soc2',
        name: 'SOC 2 Type II Vendor Assessment',
        framework: 'SOC2',
        description:
          'Assessment based on SOC 2 Trust Service Criteria for security, availability, processing integrity, confidentiality, and privacy.',
        questions: [
          { order: 1, category: 'Security', question: 'Does the vendor have a current SOC 2 Type II report?', weight: 3 },
          { order: 2, category: 'Security', question: 'Does the vendor implement multi-factor authentication?', weight: 3 },
          { order: 3, category: 'Security', question: 'Does the vendor perform regular penetration testing?', weight: 2 },
          { order: 4, category: 'Availability', question: 'Does the vendor have documented SLAs with uptime guarantees?', weight: 2 },
          { order: 5, category: 'Availability', question: 'Does the vendor have a disaster recovery plan?', weight: 3 },
          { order: 6, category: 'Processing Integrity', question: 'Does the vendor have quality assurance processes?', weight: 2 },
          { order: 7, category: 'Confidentiality', question: 'Does the vendor classify and handle data by sensitivity levels?', weight: 3 },
          { order: 8, category: 'Confidentiality', question: 'Does the vendor have data retention and disposal policies?', weight: 2 },
          { order: 9, category: 'Privacy', question: 'Does the vendor have a published privacy policy?', weight: 2 },
          { order: 10, category: 'Privacy', question: 'Does the vendor provide notice and consent mechanisms for data collection?', weight: 2 },
        ],
      },
      {
        id: 'hitrust',
        name: 'HITRUST CSF Vendor Assessment',
        framework: 'HITRUST',
        description:
          'Assessment based on the HITRUST Common Security Framework for healthcare information security.',
        questions: [
          { order: 1, category: 'Information Protection Program', question: 'Does the vendor have HITRUST CSF certification?', weight: 3 },
          { order: 2, category: 'Information Protection Program', question: 'Does the vendor have a formal information security management program?', weight: 3 },
          { order: 3, category: 'Endpoint Protection', question: 'Does the vendor implement endpoint detection and response (EDR)?', weight: 2 },
          { order: 4, category: 'Portable Media Security', question: 'Does the vendor have policies for portable media and BYOD?', weight: 2 },
          { order: 5, category: 'Mobile Device Security', question: 'Does the vendor have mobile device management (MDM) in place?', weight: 2 },
          { order: 6, category: 'Wireless Security', question: 'Does the vendor implement wireless network security controls?', weight: 2 },
          { order: 7, category: 'Configuration Management', question: 'Does the vendor have a configuration management and change control process?', weight: 3 },
          { order: 8, category: 'Vulnerability Management', question: 'Does the vendor perform regular vulnerability scanning and patching?', weight: 3 },
          { order: 9, category: 'Network Protection', question: 'Does the vendor implement network segmentation and firewall controls?', weight: 3 },
          { order: 10, category: 'Transmission Protection', question: 'Does the vendor encrypt data in transit using TLS 1.2 or higher?', weight: 3 },
        ],
      },
    ],
    error: null,
  };
}

export function calculateRiskScore(responses: { score: number }[]): number {
  if (responses.length === 0) return 0;

  const total = responses.reduce((sum, r) => sum + r.score, 0);
  return Math.round(total / responses.length);
}

export async function getRemediationTasks(
  orgId: string,
  filters: RemediationFilters = {}
) {
  const supabase = await createClient();
  const {
    status,
    vendor_id,
    assessment_id,
    priority,
    page = 1,
    per_page = 20,
  } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('remediation_tasks')
    .select('*, vendors(id, name), risk_assessments(id, title)', {
      count: 'exact',
    })
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true });

  if (status) {
    query = query.eq('status', status as any);
  }

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (assessment_id) {
    query = query.eq('assessment_id', assessment_id);
  }

  if (priority) {
    query = query.eq('priority', priority as any);
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

export async function createRemediationTask(data: RemediationTaskInsert) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from('remediation_tasks')
    .insert(data)
    .select()
    .single();

  return { data: task, error };
}

export async function updateRemediationTask(
  id: string,
  data: RemediationTaskUpdate
) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from('remediation_tasks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: task, error };
}
