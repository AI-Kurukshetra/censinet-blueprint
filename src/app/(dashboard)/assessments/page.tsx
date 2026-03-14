'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { RiskAssessment, Vendor, RiskLevel, AssessmentStatus, Pagination } from '@/types'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  ClipboardCheck,
  Calendar,
  Filter,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
]

const RISK_OPTIONS = [
  { value: '', label: 'All Risk Levels' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'minimal', label: 'Minimal' },
]

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const config: Record<AssessmentStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    expired: { label: 'Expired', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  }
  const c = config[status] ?? config.draft
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  )
}

function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return <span className="text-xs text-muted-foreground">--</span>
  const config: Record<RiskLevel, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    low: { label: 'Low', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    minimal: { label: 'Minimal', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  }
  const c = config[level]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted" />
        </td>
      ))}
    </tr>
  )
}

interface AssessmentRow extends RiskAssessment {
  vendors?: { name: string } | null
}

export default function AssessmentsPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentRow[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('per_page', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (riskFilter) params.set('risk_level', riskFilter)

      const res = await fetch(`/api/assessments?${params.toString()}`)
      const body = await res.json()
      if (res.ok) {
        setAssessments(body.data ?? [])
        if (body.pagination) {
          setPagination({
            page: body.pagination.page,
            per_page: body.pagination.per_page,
            total: body.pagination.total ?? 0,
            total_pages: Math.ceil(
              (body.pagination.total ?? 0) / body.pagination.per_page
            ),
          })
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [pagination.page, statusFilter, riskFilter])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Assessments</h1>
          <p className="text-sm text-muted-foreground">
            Conduct and manage vendor risk assessments across compliance frameworks.
          </p>
        </div>
        <Button onClick={() => router.push('/assessments/new')}>
          <Plus className="mr-1.5 size-4" />
          New Assessment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Framework</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Due Date</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Assessor</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <ClipboardCheck className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No assessments found</p>
                        <p className="text-sm text-muted-foreground">
                          {statusFilter || riskFilter
                            ? 'Try adjusting your filters.'
                            : 'Start by creating your first risk assessment.'}
                        </p>
                      </div>
                      {!statusFilter && !riskFilter && (
                        <Button
                          size="sm"
                          onClick={() => router.push('/assessments/new')}
                        >
                          <Plus className="mr-1.5 size-3.5" />
                          New Assessment
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                assessments.map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/assessments/${assessment.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{assessment.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(assessment as any).vendors?.name ?? '--'}
                    </td>
                    <td className="px-4 py-3">
                      {assessment.framework ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {assessment.framework}
                        </span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={assessment.status} />
                    </td>
                    <td className="px-4 py-3">
                      {assessment.risk_score !== null ? (
                        <span className="font-medium">{assessment.risk_score}</span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={assessment.risk_level} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {assessment.due_date
                        ? new Date(assessment.due_date).toLocaleDateString()
                        : '--'}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {assessment.assessor_id ? (
                        <span className="text-xs">Assigned</span>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionMenuId(
                              actionMenuId === assessment.id ? null : assessment.id
                            )
                          }}
                          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                        {actionMenuId === assessment.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionMenuId(null)
                              }}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-card py-1 shadow-lg">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/assessments/${assessment.id}`)
                                  setActionMenuId(null)
                                }}
                              >
                                <Eye className="size-3.5" />
                                View
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/assessments/${assessment.id}`)
                                  setActionMenuId(null)
                                }}
                              >
                                <Edit className="size-3.5" />
                                Edit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total > pagination.per_page && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} assessments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-medium">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
