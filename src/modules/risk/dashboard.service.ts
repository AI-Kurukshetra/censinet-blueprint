import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

interface DashboardMetrics {
  total_vendors: number;
  high_risk_vendors: number;
  pending_assessments: number;
  compliance_rate: number;
  active_incidents: number;
  expiring_contracts: number;
  recent_alerts: number;
  avg_risk_score: number;
}

interface RiskDistribution {
  risk_level: string;
  count: number;
}

export async function getDashboardMetrics(
  orgId: string
): Promise<{ data: DashboardMetrics | null; error: unknown }> {
  const supabase = await createClient();

  try {
    const [
      vendorsResult,
      highRiskResult,
      pendingAssessmentsResult,
      complianceResult,
      incidentsResult,
      contractsResult,
      alertsResult,
      riskScoreResult,
    ] = await Promise.all([
      // Total vendors
      supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .neq('status', 'archived'),

      // High risk vendors
      supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('risk_level', ['high', 'critical'])
        .neq('status', 'archived'),

      // Pending assessments
      supabase
        .from('risk_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['draft', 'in_progress', 'under_review']),

      // Compliance items for rate calculation
      supabase
        .from('compliance_items')
        .select('status')
        .eq('organization_id', orgId),

      // Active incidents
      supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['reported', 'investigating', 'contained'] as any),

      // Contracts expiring in 90 days
      (() => {
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + 90);
        return supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('end_date', now.toISOString())
          .lte('end_date', future.toISOString());
      })(),

      // Recent alerts (last 7 days)
      (() => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('created_at', weekAgo.toISOString());
      })(),

      // Average risk score from completed assessments
      supabase
        .from('risk_assessments')
        .select('risk_score')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .not('risk_score', 'is', null),
    ]);

    // Calculate compliance rate
    const complianceItems = complianceResult.data ?? [];
    const totalCompliance = complianceItems.length;
    const compliantCount = complianceItems.filter(
      (i) => i.status === 'compliant'
    ).length;
    const complianceRate =
      totalCompliance > 0
        ? Math.round((compliantCount / totalCompliance) * 100)
        : 0;

    // Calculate average risk score
    const scores = (riskScoreResult.data ?? [])
      .map((a) => a.risk_score)
      .filter((s): s is number => s !== null);
    const avgRiskScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0;

    return {
      data: {
        total_vendors: vendorsResult.count ?? 0,
        high_risk_vendors: highRiskResult.count ?? 0,
        pending_assessments: pendingAssessmentsResult.count ?? 0,
        compliance_rate: complianceRate,
        active_incidents: incidentsResult.count ?? 0,
        expiring_contracts: contractsResult.count ?? 0,
        recent_alerts: alertsResult.count ?? 0,
        avg_risk_score: avgRiskScore,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getRiskDistribution(
  orgId: string
): Promise<{ data: RiskDistribution[] | null; error: unknown }> {
  const supabase = await createClient();

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('risk_level')
    .eq('organization_id', orgId)
    .neq('status', 'archived');

  if (error) {
    return { data: null, error };
  }

  const counts: Record<string, number> = {};
  for (const vendor of vendors ?? []) {
    const level = vendor.risk_level ?? 'unassessed';
    counts[level] = (counts[level] ?? 0) + 1;
  }

  const distribution = Object.entries(counts).map(([risk_level, count]) => ({
    risk_level,
    count,
  }));

  return { data: distribution, error: null };
}

export async function getRecentActivity(orgId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user_profiles(id, first_name, last_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function getAssessmentTrend(orgId: string) {
  const supabase = await createClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: assessments, error } = await supabase
    .from('risk_assessments')
    .select('created_at, status')
    .eq('organization_id', orgId)
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  const monthlyData: Record<string, { total: number; completed: number }> = {};

  for (const assessment of assessments ?? []) {
    const date = new Date(assessment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, completed: 0 };
    }

    monthlyData[monthKey].total += 1;
    if (assessment.status === 'completed') {
      monthlyData[monthKey].completed += 1;
    }
  }

  const trend = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({
      month,
      ...counts,
    }));

  return { data: trend, error: null };
}

export async function getVendorRiskOverTime(orgId: string) {
  const supabase = await createClient();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: assessments, error } = await supabase
    .from('risk_assessments')
    .select('completed_at, risk_score')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .not('risk_score', 'is', null)
    .not('completed_at', 'is', null)
    .gte('completed_at', twelveMonthsAgo.toISOString())
    .order('completed_at', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  const monthlyScores: Record<string, number[]> = {};

  for (const assessment of assessments ?? []) {
    if (!assessment.completed_at || assessment.risk_score === null) continue;

    const date = new Date(assessment.completed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyScores[monthKey]) {
      monthlyScores[monthKey] = [];
    }

    monthlyScores[monthKey].push(assessment.risk_score);
  }

  const trend = Object.entries(monthlyScores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, scores]) => ({
      month,
      avg_risk_score: Math.round(
        scores.reduce((sum, s) => sum + s, 0) / scores.length
      ),
      assessment_count: scores.length,
    }));

  return { data: trend, error: null };
}
