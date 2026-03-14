'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  AlertOctagon,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RiskDistributionChart } from '@/components/dashboard/risk-distribution-chart'
import { AssessmentTrendChart } from '@/components/dashboard/assessment-trend-chart'
import { RecentActivity, type ActivityEntry } from '@/components/dashboard/recent-activity'
import { TopRiskVendors, type RiskVendor } from '@/components/dashboard/top-risk-vendors'
import type { DashboardMetrics } from '@/types'

interface DashboardData {
  metrics: DashboardMetrics
  risk_distribution: { name: string; value: number; color: string }[]
  assessment_trend: { month: string; count: number }[]
  recent_activity: ActivityEntry[]
  top_risk_vendors: RiskVendor[]
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  className?: string
}

function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here&apos;s an overview of your vendor risk landscape.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard
              title="Total Vendors"
              value={data.metrics.total_vendors}
              icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
              description="Managed vendors"
            />
            <StatCard
              title="High Risk"
              value={data.metrics.high_risk_vendors}
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              description="Require attention"
              className={data.metrics.high_risk_vendors > 0 ? 'border-red-200 dark:border-red-900/50' : ''}
            />
            <StatCard
              title="Pending Assessments"
              value={data.metrics.pending_assessments}
              icon={<ClipboardCheck className="h-5 w-5 text-muted-foreground" />}
              description="Awaiting review"
            />
            <StatCard
              title="Compliance Rate"
              value={`${data.metrics.compliance_rate}%`}
              icon={
                <Shield
                  className={`h-5 w-5 ${
                    data.metrics.compliance_rate > 80
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }`}
                />
              }
              description={data.metrics.compliance_rate > 80 ? 'On track' : 'Needs improvement'}
              className={data.metrics.compliance_rate > 80 ? 'border-green-200 dark:border-green-900/50' : ''}
            />
            <StatCard
              title="Active Incidents"
              value={data.metrics.active_incidents}
              icon={<AlertOctagon className="h-5 w-5 text-muted-foreground" />}
              description="Open incidents"
            />
            <StatCard
              title="Expiring Contracts"
              value={data.metrics.expiring_contracts}
              icon={<FileText className="h-5 w-5 text-muted-foreground" />}
              description="Within 90 days"
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : data ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskDistributionChart data={data.risk_distribution} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assessment Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <AssessmentTrendChart data={data.assessment_trend} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <TableSkeleton />
            <TableSkeleton />
          </>
        ) : data ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={data.recent_activity} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Risk Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <TopRiskVendors vendors={data.top_risk_vendors} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
