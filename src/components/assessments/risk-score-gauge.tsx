'use client'

import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

interface RiskScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  riskLevel?: RiskLevel | null
  showLabel?: boolean
  className?: string
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  if (score >= 20) return 'low'
  return 'minimal'
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'medium': return '#eab308'
    case 'low': return '#22c55e'
    case 'minimal': return '#06b6d4'
  }
}

function getRiskLabel(level: RiskLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

const sizes = {
  sm: { width: 100, height: 60, strokeWidth: 8, fontSize: 18, labelSize: 10 },
  md: { width: 160, height: 96, strokeWidth: 12, fontSize: 28, labelSize: 13 },
  lg: { width: 220, height: 132, strokeWidth: 16, fontSize: 40, labelSize: 16 },
}

export function RiskScoreGauge({
  score,
  size = 'md',
  riskLevel,
  showLabel = true,
  className,
}: RiskScoreGaugeProps) {
  const level = riskLevel ?? getRiskLevel(score)
  const color = getRiskColor(level)
  const label = getRiskLabel(level)
  const s = sizes[size]

  const cx = s.width / 2
  const cy = s.height - 4
  const radius = cx - s.strokeWidth
  const circumference = Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100) / 100
  const dashOffset = circumference * (1 - progress)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <svg
        width={s.width}
        height={s.height}
        viewBox={`0 0 ${s.width} ${s.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${s.strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${s.width - s.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />
        {/* Progress arc */}
        <path
          d={`M ${s.strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${s.width - s.strokeWidth / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={s.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
        {/* Score text */}
        <text
          x={cx}
          y={cy - s.fontSize * 0.3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={s.fontSize}
          fontWeight="700"
          fill={color}
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span
          className="mt-1 text-xs font-semibold uppercase tracking-wider"
          style={{ color, fontSize: s.labelSize }}
        >
          {label} Risk
        </span>
      )}
    </div>
  )
}
