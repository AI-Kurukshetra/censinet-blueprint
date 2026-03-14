import { cn } from '@/lib/utils'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal'

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

const riskConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  minimal: {
    label: 'Minimal',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
