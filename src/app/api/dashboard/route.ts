import { createClient } from '@/lib/supabase/server'
import { getAuthContext, unauthorizedResponse, errorResponse, successResponse } from '@/lib/api-utils'

const RISK_COLORS: Record<string, string> = {
  critical: 'hsl(var(--destructive))',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#0284c7',
  minimal: '#059669',
  unassessed: '#64748b',
}

export async function GET() {
  try {
    const supabase = await createClient()
    const auth = await getAuthContext(supabase)
    if (!auth) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        return successResponse({
          metrics: {
            total_vendors: 0,
            high_risk_vendors: 0,
            pending_assessments: 0,
            compliance_rate: 0,
            active_incidents: 0,
            expiring_contracts: 0,
          },
          risk_distribution: [],
          assessment_trend: [],
          recent_activity: [],
          top_risk_vendors: [],
        })
      }
      return unauthorizedResponse()
    }

    const orgId = auth.profile.organization_id

    // Fetch all dashboard inputs in parallel.
    const [
      vendorsResult,
      assessmentsResult,
      incidentsResult,
      complianceResult,
      contractsResult,
      assessmentsTrendResult,
      recentActivityResult,
    ] = await Promise.all([
      supabase
        .from('vendors')
        .select('id, name, status, risk_level, risk_score', { count: 'exact' })
        .eq('organization_id', orgId),

      supabase
        .from('risk_assessments')
        .select('id, vendor_id, status, created_at, completed_at')
        .eq('organization_id', orgId),

      supabase
        .from('incidents')
        .select('id, status')
        .eq('organization_id', orgId)
        .neq('status', 'closed'),

      supabase
        .from('compliance_items')
        .select('id, status')
        .eq('organization_id', orgId),

      supabase
        .from('contracts')
        .select('id, end_date')
        .eq('organization_id', orgId)
        .eq('status', 'active'),

      supabase
        .from('risk_assessments')
        .select('id, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true }),

      supabase
        .from('audit_logs')
        .select('id, action, resource_type, resource_id, details, created_at, user_id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const vendors = vendorsResult.data ?? []
    const assessments = assessmentsResult.data ?? []
    const incidents = incidentsResult.data ?? []
    const complianceItems = complianceResult.data ?? []
    const contracts = contractsResult.data ?? []
    const trendRows = assessmentsTrendResult.data ?? []
    const auditRows = recentActivityResult.data ?? []

    const riskBuckets: Record<string, number> = {}
    for (const vendor of vendors) {
      const bucket = vendor.risk_level ?? 'unassessed'
      riskBuckets[bucket] = (riskBuckets[bucket] ?? 0) + 1
    }

    const risk_distribution = Object.entries(riskBuckets).map(([name, value]) => ({
      name,
      value,
      color: RISK_COLORS[name] ?? RISK_COLORS.unassessed,
    }))

    const pendingStatuses = new Set(['draft', 'in_progress', 'under_review'])
    const pending_assessments = assessments.filter((a) => pendingStatuses.has(a.status)).length
    const high_risk_vendors = vendors.filter((v) => v.risk_level === 'high' || v.risk_level === 'critical').length
    const active_incidents = incidents.length

    const compliantItems = complianceItems.filter((c) => c.status === 'compliant').length
    const compliance_rate =
      complianceItems.length > 0
        ? Math.round((compliantItems / complianceItems.length) * 100)
        : 0

    const now = new Date()
    const inNinetyDays = new Date()
    inNinetyDays.setDate(now.getDate() + 90)
    const expiring_contracts = contracts.filter((c) => {
      if (!c.end_date) return false
      const end = new Date(c.end_date)
      return end >= now && end <= inNinetyDays
    }).length

    const monthlyCounts = new Map<string, number>()
    for (const row of trendRows) {
      const d = new Date(row.created_at)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1)
    }
    const assessment_trend = Array.from(monthlyCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }))

    const latestAssessmentByVendor = new Map<string, string>()
    for (const assessment of assessments) {
      if (!assessment.vendor_id) continue
      const existing = latestAssessmentByVendor.get(assessment.vendor_id)
      const current = assessment.completed_at ?? assessment.created_at
      if (!existing || new Date(current) > new Date(existing)) {
        latestAssessmentByVendor.set(assessment.vendor_id, current)
      }
    }

    const top_risk_vendors = [...vendors]
      .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
      .slice(0, 5)
      .map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        risk_score: vendor.risk_score ?? 0,
        risk_level: vendor.risk_level ?? 'unassessed',
        last_assessment_date: latestAssessmentByVendor.get(vendor.id) ?? null,
        status: vendor.status,
      }))

    const recent_activity = auditRows.map((row) => {
      const details =
        row.details && typeof row.details === 'object' ? (row.details as Record<string, unknown>) : null
      const detailsName =
        typeof details?.resource_name === 'string'
          ? details.resource_name
          : typeof details?.name === 'string'
            ? details.name
            : typeof details?.title === 'string'
              ? details.title
              : null

      return {
        id: row.id,
        user_name: 'Team Member',
        user_email: '',
        action: row.action,
        resource_type: row.resource_type ?? 'system',
        resource_name: detailsName ?? row.resource_id ?? 'Unknown resource',
        created_at: row.created_at,
      }
    })

    return successResponse({
      metrics: {
        total_vendors: vendors.length,
        high_risk_vendors,
        pending_assessments,
        compliance_rate,
        active_incidents,
        expiring_contracts,
      },
      risk_distribution,
      assessment_trend,
      recent_activity,
      top_risk_vendors,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
    return errorResponse(message)
  }
}
