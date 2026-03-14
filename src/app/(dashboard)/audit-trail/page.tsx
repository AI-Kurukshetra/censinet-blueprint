'use client'

import { useState, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Globe,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resourceType: string
  resourceId: string
  ipAddress: string
  details: Record<string, unknown>
  createdAt: string
}

// --- Mock Data ---

const mockLogs: AuditLog[] = [
  { id: '1', userId: 'u1', userName: 'Sarah Chen', action: 'create', resourceType: 'incident', resourceId: 'inc-001', ipAddress: '192.168.1.42', details: { title: 'Unauthorized PHI Access Detected', severity: 'critical' }, createdAt: '2026-03-14T08:30:00Z' },
  { id: '2', userId: 'u2', userName: 'Mike Johnson', action: 'update', resourceType: 'incident', resourceId: 'inc-001', ipAddress: '192.168.1.55', details: { field: 'status', oldValue: 'reported', newValue: 'investigating' }, createdAt: '2026-03-14T08:45:00Z' },
  { id: '3', userId: 'u1', userName: 'Sarah Chen', action: 'update', resourceType: 'vendor', resourceId: 'v-cloudmedix', ipAddress: '192.168.1.42', details: { field: 'risk_score', oldValue: 35, newValue: 68 }, createdAt: '2026-03-13T14:00:00Z' },
  { id: '4', userId: 'u3', userName: 'Emily Davis', action: 'create', resourceType: 'document', resourceId: 'doc-008', ipAddress: '192.168.1.30', details: { name: 'MedSecure Risk Assessment', type: 'risk_assessment' }, createdAt: '2026-03-13T13:00:00Z' },
  { id: '5', userId: 'u2', userName: 'Mike Johnson', action: 'update', resourceType: 'compliance_item', resourceId: 'ci-002', ipAddress: '192.168.1.55', details: { field: 'status', oldValue: 'not_assessed', newValue: 'non_compliant' }, createdAt: '2026-03-13T11:30:00Z' },
  { id: '6', userId: 'u1', userName: 'Sarah Chen', action: 'create', resourceType: 'contract', resourceId: 'con-006', ipAddress: '192.168.1.42', details: { title: 'Penetration Testing', vendor: 'SecureTest Inc' }, createdAt: '2026-03-12T10:00:00Z' },
  { id: '7', userId: 'u3', userName: 'Emily Davis', action: 'update', resourceType: 'baa', resourceId: 'baa-003', ipAddress: '192.168.1.30', details: { field: 'status', oldValue: 'draft', newValue: 'pending_signature' }, createdAt: '2026-03-12T09:15:00Z' },
  { id: '8', userId: 'u2', userName: 'Mike Johnson', action: 'delete', resourceType: 'document', resourceId: 'doc-005', ipAddress: '192.168.1.55', details: { name: 'Outdated Security Policy v2.1' }, createdAt: '2026-03-11T16:00:00Z' },
  { id: '9', userId: 'u1', userName: 'Sarah Chen', action: 'create', resourceType: 'assessment', resourceId: 'asmnt-009', ipAddress: '192.168.1.42', details: { title: 'MedSecure Annual Review', vendor: 'MedSecure' }, createdAt: '2026-03-11T14:30:00Z' },
  { id: '10', userId: 'u3', userName: 'Emily Davis', action: 'update', resourceType: 'vendor', resourceId: 'v-compliancehub', ipAddress: '192.168.1.30', details: { field: 'status', oldValue: 'active', newValue: 'inactive' }, createdAt: '2026-03-10T11:00:00Z' },
  { id: '11', userId: 'u2', userName: 'Mike Johnson', action: 'login', resourceType: 'auth', resourceId: 'u2', ipAddress: '192.168.1.55', details: { method: 'password' }, createdAt: '2026-03-10T08:00:00Z' },
  { id: '12', userId: 'u1', userName: 'Sarah Chen', action: 'export', resourceType: 'report', resourceId: 'rpt-q1-2026', ipAddress: '192.168.1.42', details: { format: 'PDF', reportType: 'Compliance Summary' }, createdAt: '2026-03-09T15:00:00Z' },
]

const users = ['Sarah Chen', 'Mike Johnson', 'Emily Davis']
const resourceTypes = ['incident', 'vendor', 'document', 'compliance_item', 'contract', 'baa', 'assessment', 'auth', 'report']
const actions = ['create', 'update', 'delete', 'login', 'export']

// --- Helpers ---

function getActionColor(action: string) {
  switch (action) {
    case 'create': return 'bg-green-100 text-green-800 border-green-200'
    case 'update': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'delete': return 'bg-red-100 text-red-800 border-red-200'
    case 'login': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'export': return 'bg-orange-100 text-orange-800 border-orange-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// --- Component ---

export default function AuditTrailPage() {
  const [isLoading] = useState(false)
  const [userFilter, setUserFilter] = useState<string>('all')
  const [resourceFilter, setResourceFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      if (userFilter !== 'all' && log.userName !== userFilter) return false
      if (resourceFilter !== 'all' && log.resourceType !== resourceFilter) return false
      if (actionFilter !== 'all' && log.action !== actionFilter) return false
      if (dateFrom && log.createdAt < dateFrom) return false
      if (dateTo && log.createdAt > dateTo + 'T23:59:59Z') return false
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          log.userName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.resourceType.toLowerCase().includes(searchLower) ||
          log.resourceId.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [userFilter, resourceFilter, actionFilter, dateFrom, dateTo, search])

  function toggleExpanded(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete log of all system activities and changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="size-4" />
          Export
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
            >
              <option value="all">All Resources</option>
              {resourceTypes.map((r) => (
                <option key={r} value={r}>{formatLabel(r)}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{formatLabel(a)}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">From:</Label>
              <Input
                type="date"
                className="h-8 w-36"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">To:</Label>
              <Input
                type="date"
                className="h-8 w-36"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
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
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <History className="mb-4 size-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Resource ID</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const isExpanded = expandedRows.has(log.id)
                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer"
                        onClick={() => toggleExpanded(log.id)}
                      >
                        <TableCell>
                          <Button variant="ghost" size="icon-xs" aria-label="Toggle details">
                            {isExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3.5 text-muted-foreground" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{log.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getActionColor(log.action)}`}>
                            {formatLabel(log.action)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatLabel(log.resourceType)}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {log.resourceId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Globe className="size-3.5" />
                            {log.ipAddress}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-details`}>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="px-4 py-3">
                              <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                                Details
                              </h4>
                              <pre className="rounded-md bg-muted p-3 text-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {mockLogs.length} log entries
      </div>
    </div>
  )
}
