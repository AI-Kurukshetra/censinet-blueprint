'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface RiskVendor {
  id: string
  name: string
  risk_score: number
  risk_level: string
  last_assessment_date: string | null
  status: string
}

interface TopRiskVendorsProps {
  vendors: RiskVendor[]
}

function getRiskBadgeColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'low':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'minimal':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    default:
      return ''
  }
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'pending_review':
      return 'secondary'
    case 'suspended':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-red-500'
  if (score >= 60) return 'bg-orange-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function TopRiskVendors({ vendors }: TopRiskVendorsProps) {
  if (!vendors || vendors.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No vendor data available
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Risk Score</TableHead>
          <TableHead>Risk Level</TableHead>
          <TableHead>Last Assessment</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  value={vendor.risk_score}
                  className="w-16"
                  indicatorClassName={getProgressColor(vendor.risk_score)}
                />
                <span className="text-sm text-muted-foreground">
                  {vendor.risk_score}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getRiskBadgeColor(vendor.risk_level)}
              >
                {vendor.risk_level}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {vendor.last_assessment_date
                ? format(new Date(vendor.last_assessment_date), 'MMM d, yyyy')
                : 'Never'}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(vendor.status)}>
                {vendor.status.replace('_', ' ')}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
