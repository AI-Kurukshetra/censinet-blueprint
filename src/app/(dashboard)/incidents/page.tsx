'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
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

type Severity = 'critical' | 'high' | 'medium' | 'low'
type IncidentStatus = 'reported' | 'investigating' | 'contained' | 'remediation' | 'resolved' | 'closed'

interface Incident {
  id: string
  title: string
  vendor: string | null
  severity: Severity
  status: IncidentStatus
  phiCompromised: boolean
  individualsAffected: number
  reportedAt: string
  assignedTo: string | null
}

// --- Mock Data ---

const mockIncidents: Incident[] = [
  { id: '1', title: 'Unauthorized PHI Access Detected', vendor: 'CloudMedix', severity: 'critical', status: 'investigating', phiCompromised: true, individualsAffected: 1250, reportedAt: '2026-03-12T14:30:00Z', assignedTo: 'Sarah Chen' },
  { id: '2', title: 'API Authentication Bypass', vendor: 'HealthSync', severity: 'high', status: 'contained', phiCompromised: false, individualsAffected: 0, reportedAt: '2026-03-10T09:15:00Z', assignedTo: 'Mike Johnson' },
  { id: '3', title: 'Data Encryption Failure on Backup', vendor: 'DataVault Pro', severity: 'high', status: 'reported', phiCompromised: true, individualsAffected: 340, reportedAt: '2026-03-13T16:45:00Z', assignedTo: null },
  { id: '4', title: 'Phishing Campaign Targeting Vendor Staff', vendor: 'MedSecure', severity: 'medium', status: 'resolved', phiCompromised: false, individualsAffected: 0, reportedAt: '2026-03-05T11:00:00Z', assignedTo: 'Emily Davis' },
  { id: '5', title: 'Delayed Security Patch Deployment', vendor: 'CloudMedix', severity: 'medium', status: 'remediation', phiCompromised: false, individualsAffected: 0, reportedAt: '2026-03-08T08:30:00Z', assignedTo: 'Sarah Chen' },
  { id: '6', title: 'Unusual Network Traffic Pattern', vendor: null, severity: 'low', status: 'investigating', phiCompromised: false, individualsAffected: 0, reportedAt: '2026-03-11T13:20:00Z', assignedTo: 'Mike Johnson' },
  { id: '7', title: 'Vendor Compliance Certificate Expired', vendor: 'ComplianceHub', severity: 'low', status: 'resolved', phiCompromised: false, individualsAffected: 0, reportedAt: '2026-02-28T10:00:00Z', assignedTo: 'Emily Davis' },
]

const severities: Severity[] = ['critical', 'high', 'medium', 'low']
const incidentStatuses: IncidentStatus[] = ['reported', 'investigating', 'contained', 'remediation', 'resolved', 'closed']
const vendorList = ['CloudMedix', 'HealthSync', 'DataVault Pro', 'MedSecure', 'ComplianceHub']

// --- Helpers ---

function getSeverityColor(severity: Severity) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

function getStatusColor(status: IncidentStatus) {
  switch (status) {
    case 'reported': return 'bg-red-100 text-red-800 border-red-200'
    case 'investigating': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'contained': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'remediation': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
    case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// --- Component ---

export default function IncidentsPage() {
  const [isLoading] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filteredIncidents = useMemo(() => {
    return mockIncidents.filter((item) => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (vendorFilter !== 'all' && (item.vendor || '') !== vendorFilter) return false
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [severityFilter, statusFilter, vendorFilter, search])

  const stats = useMemo(() => {
    const open = mockIncidents.filter((i) => i.status === 'reported').length
    const investigating = mockIncidents.filter((i) => i.status === 'investigating').length
    const contained = mockIncidents.filter((i) => i.status === 'contained').length
    const resolved = mockIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length
    return { open, investigating, contained, resolved }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
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
          <h1 className="text-2xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage security incidents and PHI breaches
          </p>
        </div>
        <Link href="/incidents/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Report Incident
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
              <ShieldX className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100">
              <ShieldAlert className="size-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.investigating}</p>
              <p className="text-xs text-muted-foreground">Investigating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100">
              <Shield className="size-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.contained}</p>
              <p className="text-xs text-muted-foreground">Contained</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
              <ShieldCheck className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
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
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              {severities.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {incidentStatuses.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {vendorList.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
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
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertTriangle className="mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No incidents found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PHI Compromised</TableHead>
                  <TableHead>Individuals</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {incident.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {incident.vendor || '--'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                        {formatLabel(incident.severity)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(incident.status)}`}>
                        {formatLabel(incident.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {incident.phiCompromised ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                          <ShieldX className="size-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {incident.individualsAffected > 0
                        ? incident.individualsAffected.toLocaleString()
                        : '--'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(incident.reportedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {incident.assignedTo || '--'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/incidents/${incident.id}`} aria-label="View" className={buttonVariants({ variant: "ghost", size: "icon-xs" })}>
                          <Eye className="size-3.5" />
                      </Link>
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
