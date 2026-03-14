import { cn } from '@/lib/utils'

type StatusVariant = 'vendor' | 'assessment' | 'compliance' | 'incident' | 'contract'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
}

const statusStyles: Record<StatusVariant, Record<string, string>> = {
  vendor: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-800 border-slate-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    suspended: 'bg-red-100 text-red-800 border-red-200',
    onboarding: 'bg-blue-100 text-blue-800 border-blue-200',
    offboarding: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  assessment: {
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    draft: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  compliance: {
    compliant: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'non-compliant': 'bg-red-100 text-red-800 border-red-200',
    'partially-compliant': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'under-review': 'bg-blue-100 text-blue-800 border-blue-200',
  },
  incident: {
    open: 'bg-red-100 text-red-800 border-red-200',
    investigating: 'bg-orange-100 text-orange-800 border-orange-200',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    closed: 'bg-slate-100 text-slate-800 border-slate-200',
    mitigated: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  contract: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    'pending-renewal': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    draft: 'bg-slate-100 text-slate-800 border-slate-200',
    terminated: 'bg-red-100 text-red-800 border-red-200',
  },
}

const defaultStyle = 'bg-slate-100 text-slate-800 border-slate-200'

export function StatusBadge({
  status,
  variant = 'vendor',
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-')
  const variantStyles = statusStyles[variant]
  const style = variantStyles?.[normalizedStatus] ?? defaultStyle

  const displayLabel =
    status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        style,
        className
      )}
    >
      {displayLabel}
    </span>
  )
}
