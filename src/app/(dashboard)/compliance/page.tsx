'use client'

import { useState, useMemo } from 'react'
import {
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Eye,
  FileEdit,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// --- Types ---

type ComplianceStatus =
  | 'compliant'
  | 'non_compliant'
  | 'partially_compliant'
  | 'not_assessed'
  | 'in_remediation'
  | 'waived'

interface ComplianceItem {
  id: string
  requirementKey: string
  title: string
  framework: string
  vendor: string | null
  status: ComplianceStatus
  dueDate: string | null
}

// --- Mock Data ---

const mockItems: ComplianceItem[] = [
  { id: '1', requirementKey: 'HIPAA-164.312(a)', title: 'Access Control - Unique User ID', framework: 'HIPAA', vendor: 'CloudMedix', status: 'compliant', dueDate: '2026-06-15' },
  { id: '2', requirementKey: 'HIPAA-164.312(c)', title: 'Integrity Controls', framework: 'HIPAA', vendor: 'HealthSync', status: 'non_compliant', dueDate: '2026-04-01' },
  { id: '3', requirementKey: 'HIPAA-164.312(e)', title: 'Transmission Security', framework: 'HIPAA', vendor: null, status: 'partially_compliant', dueDate: '2026-05-20' },
  { id: '4', requirementKey: 'SOC2-CC6.1', title: 'Logical and Physical Access Controls', framework: 'SOC2', vendor: 'DataVault Pro', status: 'compliant', dueDate: '2026-07-10' },
  { id: '5', requirementKey: 'SOC2-CC7.2', title: 'System Monitoring', framework: 'SOC2', vendor: 'CloudMedix', status: 'in_remediation', dueDate: '2026-03-28' },
  { id: '6', requirementKey: 'SOC2-CC8.1', title: 'Change Management', framework: 'SOC2', vendor: null, status: 'compliant', dueDate: '2026-08-01' },
  { id: '7', requirementKey: 'HITRUST-01.a', title: 'Access Control Policy', framework: 'HITRUST', vendor: 'MedSecure', status: 'compliant', dueDate: '2026-09-15' },
  { id: '8', requirementKey: 'HITRUST-09.ab', title: 'Monitoring System Use', framework: 'HITRUST', vendor: 'HealthSync', status: 'non_compliant', dueDate: '2026-04-10' },
  { id: '9', requirementKey: 'HITRUST-06.d', title: 'Data Classification', framework: 'HITRUST', vendor: null, status: 'partially_compliant', dueDate: '2026-05-30' },
  { id: '10', requirementKey: 'HIPAA-164.308(a)(1)', title: 'Security Management Process', framework: 'HIPAA', vendor: 'DataVault Pro', status: 'compliant', dueDate: '2026-06-01' },
  { id: '11', requirementKey: 'SOC2-CC3.2', title: 'Risk Assessment', framework: 'SOC2', vendor: 'MedSecure', status: 'not_assessed', dueDate: null },
  { id: '12', requirementKey: 'HITRUST-10.a', title: 'Security Requirements Analysis', framework: 'HITRUST', vendor: 'CloudMedix', status: 'compliant', dueDate: '2026-10-01' },
]

const frameworks = ['HIPAA', 'SOC2', 'HITRUST'] as const
const statuses: ComplianceStatus[] = ['compliant', 'non_compliant', 'partially_compliant', 'not_assessed', 'in_remediation', 'waived']
const vendors = ['CloudMedix', 'HealthSync', 'DataVault Pro', 'MedSecure']

// --- Helpers ---

function getStatusColor(status: ComplianceStatus) {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800 border-green-200'
    case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200'
    case 'partially_compliant': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'not_assessed': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'in_remediation': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'waived': return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function getStatusLabel(status: ComplianceStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getStatusIcon(status: ComplianceStatus) {
  switch (status) {
    case 'compliant': return <CheckCircle2 className="size-3.5" />
    case 'non_compliant': return <XCircle className="size-3.5" />
    case 'partially_compliant': return <AlertTriangle className="size-3.5" />
    case 'in_remediation': return <Clock className="size-3.5" />
    case 'waived': return null
    default: return null
  }
}

// --- Component ---

export default function CompliancePage() {
  const [isLoading] = useState(false)
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    return mockItems.filter((item) => {
      if (frameworkFilter !== 'all' && item.framework !== frameworkFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (vendorFilter !== 'all' && (item.vendor || '') !== vendorFilter) return false
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.requirementKey.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [frameworkFilter, statusFilter, vendorFilter, search])

  const frameworkStats = useMemo(() => {
    return frameworks.map((fw) => {
      const items = mockItems.filter((i) => i.framework === fw)
      const compliant = items.filter((i) => i.status === 'compliant').length
      const rate = items.length > 0 ? Math.round((compliant / items.length) * 100) : 0
      return { framework: fw, total: items.length, compliant, rate }
    })
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Monitor compliance status across HIPAA, SOC2, and HITRUST frameworks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {frameworkStats.map((stat) => (
          <Card key={stat.framework}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{stat.framework}</CardTitle>
                <Shield className="size-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold">{stat.rate}%</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.compliant}/{stat.total} requirements
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      stat.rate >= 80 ? 'bg-green-500' : stat.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value)}
            >
              <option value="all">All Frameworks</option>
              {frameworks.map((fw) => (
                <option key={fw} value={fw}>{fw}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s)}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search requirements..."
                className="h-8 w-64 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Shield className="mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No compliance items found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {item.requirementKey}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate">
                      {item.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.framework}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.vendor || '--'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(item.status)}`}
                      >
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : '--'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="View details">
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Edit">
                          <FileEdit className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
