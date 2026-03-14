'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { VendorForm } from '@/components/vendors/vendor-form'
import { useGlobalLoader } from '@/components/shared/global-loader-provider'
import type { Vendor, VendorStatus, RiskLevel, Pagination } from '@/types'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Building2,
  Filter,
} from 'lucide-react'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
]

const RISK_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Risk Levels' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'minimal', label: 'Minimal' },
]

function StatusBadge({ status }: { status: VendorStatus }) {
  const config: Record<VendorStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
    pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    onboarding: { label: 'Onboarding', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    offboarding: { label: 'Offboarding', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    archived: { label: 'Archived', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  }
  const c = config[status] ?? config.inactive
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

function riskBarColor(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'critical': return 'bg-red-500'
    case 'high': return 'bg-orange-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    case 'minimal': return 'bg-cyan-500'
    default: return 'bg-gray-300'
  }
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-muted" />
        </td>
      ))}
    </tr>
  )
}

export default function VendorsPage() {
  const router = useRouter()
  const { withLoader } = useGlobalLoader()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const fetchVendors = useCallback(async () => {
    await withLoader(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(pagination.page))
        params.set('per_page', '20')
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)
        if (riskFilter) params.set('risk_level', riskFilter)

        const res = await fetch(`/api/vendors?${params.toString()}`)
        const body = await res.json()
        if (res.ok) {
          setVendors(body.data ?? [])
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
    })
  }, [pagination.page, search, statusFilter, riskFilter, withLoader])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to offboard this vendor?')) return
    try {
      await withLoader(async () => {
        await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
      })
      await fetchVendors()
    } catch {
      // silently fail
    }
    setActionMenuId(null)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((p) => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your third-party vendor relationships and risk profiles.
          </p>
        </div>
        <Button onClick={() => { setEditingVendor(null); setFormOpen(true) }}>
          <Plus className="mr-1.5 size-4" />
          Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Level</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">PHI Access</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Last Assessment</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <Building2 className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No vendors found</p>
                        <p className="text-sm text-muted-foreground">
                          {search || statusFilter || riskFilter
                            ? 'Try adjusting your filters.'
                            : 'Get started by adding your first vendor.'}
                        </p>
                      </div>
                      {!search && !statusFilter && !riskFilter && (
                        <Button
                          size="sm"
                          onClick={() => { setEditingVendor(null); setFormOpen(true) }}
                        >
                          <Plus className="mr-1.5 size-3.5" />
                          Add Vendor
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const score = vendor.risk_score ?? 0
                  const hasPhi = vendor.data_classification?.some(
                    (d) => d.toLowerCase().includes('phi')
                  ) ?? false

                  return (
                    <tr
                      key={vendor.id}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => router.push(`/vendors/${vendor.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{vendor.name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {vendor.category ?? '--'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn('h-full rounded-full', riskBarColor(vendor.risk_level))}
                              style={{ width: `${Math.min(score, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={vendor.risk_level} />
                      </td>
                      <td className="px-4 py-3">
                        {hasPhi ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            No
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                        {(vendor as any).last_assessed_at
                          ? new Date((vendor as any).last_assessed_at).toLocaleDateString()
                          : '--'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionMenuId(
                                actionMenuId === vendor.id ? null : vendor.id
                              )
                            }}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                          {actionMenuId === vendor.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActionMenuId(null)
                                }}
                              />
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border bg-card py-1 shadow-lg">
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/vendors/${vendor.id}`)
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
                                    setEditingVendor(vendor)
                                    setFormOpen(true)
                                    setActionMenuId(null)
                                  }}
                                >
                                  <Edit className="size-3.5" />
                                  Edit
                                </button>
                                <button
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(vendor.id)
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                  Offboard
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
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
              {pagination.total} vendors
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

      {/* Vendor Form Dialog */}
      <VendorForm
        open={formOpen}
        vendor={editingVendor}
        onClose={() => {
          setFormOpen(false)
          setEditingVendor(null)
        }}
        onSuccess={() => fetchVendors()}
      />
    </div>
  )
}
