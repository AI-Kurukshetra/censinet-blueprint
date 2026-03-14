'use client'

import { cn } from '@/lib/utils'
import type { Vendor, VendorStatus, RiskLevel } from '@/types'
import {
  Building2,
  ExternalLink,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

function statusConfig(status: VendorStatus) {
  const map: Record<VendorStatus, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
    pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    onboarding: { label: 'Onboarding', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    offboarding: { label: 'Offboarding', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    suspended: { label: 'Suspended', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    archived: { label: 'Archived', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  }
  return map[status] ?? map.inactive
}

function riskColor(level: RiskLevel | null | undefined): string {
  switch (level) {
    case 'critical': return 'bg-red-500'
    case 'high': return 'bg-orange-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
    case 'minimal': return 'bg-cyan-500'
    default: return 'bg-gray-300'
  }
}

interface VendorCardProps {
  vendor: Vendor
  onEdit?: (vendor: Vendor) => void
  className?: string
}

export function VendorCard({ vendor, onEdit, className }: VendorCardProps) {
  const router = useRouter()
  const status = statusConfig(vendor.status)
  const score = vendor.risk_score ?? 0

  return (
    <div
      className={cn(
        'group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {vendor.name}
            </h3>
            {vendor.category && (
              <p className="truncate text-xs text-muted-foreground">
                {vendor.category}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Risk Score */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Risk Score</span>
          <span className="font-semibold">{score}/100</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', riskColor(vendor.risk_level))}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>

      {/* Compliance Indicators */}
      <div className="mt-4 flex items-center gap-3">
        <ComplianceBadge label="HIPAA" compliant={vendor.hipaa_compliant} />
        <ComplianceBadge label="SOC2" compliant={vendor.soc2_certified} />
        <ComplianceBadge label="HITRUST" compliant={vendor.hitrust_certified} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => router.push(`/vendors/${vendor.id}`)}
        >
          <Eye className="mr-1.5 size-3.5" />
          View
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(vendor)}
          >
            <Edit className="mr-1.5 size-3.5" />
            Edit
          </Button>
        )}
        {vendor.website && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => window.open(vendor.website!, '_blank')}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

function ComplianceBadge({
  label,
  compliant,
}: {
  label: string
  compliant: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {compliant ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <XCircle className="size-3.5 text-muted-foreground/50" />
      )}
      <span
        className={cn(
          'text-xs font-medium',
          compliant ? 'text-foreground' : 'text-muted-foreground/50'
        )}
      >
        {label}
      </span>
    </div>
  )
}
