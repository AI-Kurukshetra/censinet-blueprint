'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RiskScoreGauge } from '@/components/assessments/risk-score-gauge'
import { useGlobalLoader } from '@/components/shared/global-loader-provider'
import type { Vendor, RiskAssessment, RiskLevel, VendorStatus } from '@/types'
import {
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  Shield,
  ClipboardCheck,
  FileText,
  FolderOpen,
  AlertTriangle,
  Calendar,
  Edit,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
] as const

type TabId = (typeof TABS)[number]['id']

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
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', c.className)}>
      {c.label}
    </span>
  )
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-lg bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    </div>
  )
}

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.id as string
  const { withLoader } = useGlobalLoader()

  const [vendor, setVendor] = useState<(Vendor & { assessments?: RiskAssessment[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    async function load() {
      await withLoader(async () => {
        setLoading(true)
        try {
          const res = await fetch(`/api/vendors/${vendorId}`)
          if (res.ok) {
            const body = await res.json()
            setVendor(body.data ?? body)
          }
        } catch {
          // fail silently
        } finally {
          setLoading(false)
        }
      })
    }
    void load()
  }, [vendorId, withLoader])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <SkeletonBlock />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16">
        <Building2 className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Vendor not found</h2>
        <Button variant="outline" onClick={() => router.push('/vendors')}>
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Vendors
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Back button + header */}
      <div>
        <button
          onClick={() => router.push('/vendors')}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Vendors
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
                <StatusBadge status={vendor.status} />
              </div>
              {vendor.category && (
                <p className="text-sm text-muted-foreground">{vendor.category}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {vendor.website && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(vendor.website!, '_blank')}
              >
                <ExternalLink className="mr-1.5 size-3.5" />
                Website
              </Button>
            )}
            <Button size="sm">
              <Edit className="mr-1.5 size-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab vendor={vendor} />}
      {activeTab === 'assessments' && <AssessmentsTab vendorId={vendorId} assessments={vendor.assessments} />}
      {activeTab === 'compliance' && <ComplianceTab vendor={vendor} />}
      {activeTab === 'contracts' && <ContractsTab vendorId={vendorId} />}
      {activeTab === 'documents' && <DocumentsTab vendorId={vendorId} />}
      {activeTab === 'incidents' && <IncidentsTab vendorId={vendorId} />}
    </div>
  )
}

/* ── Overview Tab ── */
function OverviewTab({ vendor }: { vendor: Vendor }) {
  const score = vendor.risk_score ?? 0

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Vendor Info */}
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Vendor Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Name" value={vendor.name} />
            <InfoRow label="Category" value={vendor.category} />
            <InfoRow
              label="Website"
              value={
                vendor.website ? (
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {vendor.website}
                    <ExternalLink className="size-3" />
                  </a>
                ) : null
              }
            />
            <InfoRow label="Services" value={(vendor as any).services_provided} />
            <InfoRow label="Onboarded" value={vendor.onboarded_at ? new Date(vendor.onboarded_at).toLocaleDateString() : null} />
            <InfoRow label="Next Assessment" value={(vendor as any).next_assessment_due ? new Date((vendor as any).next_assessment_due).toLocaleDateString() : null} />
          </div>

          {vendor.description && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">{vendor.description}</p>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Primary Contact
          </h3>
          <div className="space-y-3">
            {vendor.primary_contact_name && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="size-4 text-muted-foreground" />
                <span>{vendor.primary_contact_name}</span>
              </div>
            )}
            {vendor.primary_contact_email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${vendor.primary_contact_email}`} className="text-primary hover:underline">
                  {vendor.primary_contact_email}
                </a>
              </div>
            )}
            {vendor.primary_contact_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span>{vendor.primary_contact_phone}</span>
              </div>
            )}
            {(vendor.address || vendor.city) && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="size-4 text-muted-foreground" />
                <span>
                  {[vendor.address, vendor.city, vendor.state, vendor.zip_code]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            {!vendor.primary_contact_name &&
              !vendor.primary_contact_email &&
              !vendor.primary_contact_phone && (
                <p className="text-sm text-muted-foreground">No contact information available.</p>
              )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Risk Score Gauge */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Risk Score
          </h3>
          <div className="flex justify-center">
            <RiskScoreGauge score={score} riskLevel={vendor.risk_level} size="lg" />
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance
          </h3>
          <div className="space-y-3">
            <ComplianceRow label="HIPAA" compliant={vendor.hipaa_compliant} />
            <ComplianceRow label="SOC 2" compliant={vendor.soc2_certified} />
            <ComplianceRow label="HITRUST" compliant={vendor.hitrust_certified} />
          </div>
        </div>

        {/* Data Classification */}
        {(vendor as any).data_types_shared && (vendor as any).data_types_shared.length > 0 && (
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Data Types Shared
            </h3>
            <div className="flex flex-wrap gap-2">
              {((vendor as any).data_types_shared as string[]).map((dt) => (
                <span
                  key={dt}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    dt.toLowerCase().includes('phi')
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  )}
                >
                  {dt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value ?? <span className="text-muted-foreground">--</span>}</dd>
    </div>
  )
}

function ComplianceRow({ label, compliant }: { label: string; compliant: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      {compliant ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="size-4" />
          Compliant
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <XCircle className="size-4" />
          Not Verified
        </span>
      )}
    </div>
  )
}

/* ── Assessments Tab ── */
function AssessmentsTab({
  vendorId,
  assessments,
}: {
  vendorId: string
  assessments?: RiskAssessment[]
}) {
  const router = useRouter()
  const list = assessments ?? []

  if (list.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No assessments yet"
        description="Start a new risk assessment to evaluate this vendor."
        action={
          <Button size="sm" onClick={() => router.push('/assessments/new')}>
            New Assessment
          </Button>
        }
      />
    )
  }

  return (
    <div className="rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Framework</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Risk Score</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {list.map((a) => (
            <tr
              key={a.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/assessments/${a.id}`)}
            >
              <td className="px-4 py-3 font-medium">{a.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.framework ?? '--'}</td>
              <td className="px-4 py-3">
                <AssessmentStatusBadge status={a.status} />
              </td>
              <td className="px-4 py-3">{a.risk_score ?? '--'}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {a.due_date ? new Date(a.due_date).toLocaleDateString() : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssessmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    under_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', map[status] ?? map.draft)}>
      {label}
    </span>
  )
}

/* ── Compliance Tab ── */
function ComplianceTab({ vendor }: { vendor: Vendor }) {
  return (
    <EmptyState
      icon={Shield}
      title="Compliance tracking"
      description="Compliance items for this vendor will appear here once assessments are completed."
    />
  )
}

/* ── Contracts Tab ── */
function ContractsTab({ vendorId }: { vendorId: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="No contracts"
      description="Contracts and Business Associate Agreements for this vendor will be listed here."
    />
  )
}

/* ── Documents Tab ── */
function DocumentsTab({ vendorId }: { vendorId: string }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No documents"
      description="Uploaded documents, certifications, and reports for this vendor will appear here."
    />
  )
}

/* ── Incidents Tab ── */
function IncidentsTab({ vendorId }: { vendorId: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No incidents"
      description="Security incidents involving this vendor will be tracked here."
    />
  )
}

/* ── Empty State ── */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
