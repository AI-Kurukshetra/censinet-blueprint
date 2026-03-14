'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Eye,
  FileEdit,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
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

interface Contract {
  id: string
  title: string
  vendor: string
  type: string
  status: string
  startDate: string
  endDate: string
  value: number
  autoRenew: boolean
}

interface BAA {
  id: string
  vendor: string
  status: string
  version: number
  effectiveDate: string
  expirationDate: string
  phiScope: string
}

// --- Mock Data ---

const mockContracts: Contract[] = [
  { id: '1', title: 'Cloud Hosting Agreement', vendor: 'CloudMedix', type: 'service', status: 'active', startDate: '2025-01-01', endDate: '2026-12-31', value: 240000, autoRenew: true },
  { id: '2', title: 'EHR Integration License', vendor: 'HealthSync', type: 'license', status: 'active', startDate: '2025-06-01', endDate: '2026-05-31', value: 85000, autoRenew: false },
  { id: '3', title: 'Security Consulting', vendor: 'MedSecure', type: 'consulting', status: 'pending_review', startDate: '2026-04-01', endDate: '2026-09-30', value: 50000, autoRenew: false },
  { id: '4', title: 'Data Backup SaaS', vendor: 'DataVault Pro', type: 'subscription', status: 'active', startDate: '2025-03-15', endDate: '2026-03-14', value: 36000, autoRenew: true },
  { id: '5', title: 'Compliance Platform', vendor: 'ComplianceHub', type: 'subscription', status: 'expired', startDate: '2024-01-01', endDate: '2025-12-31', value: 120000, autoRenew: false },
  { id: '6', title: 'Penetration Testing', vendor: 'SecureTest Inc', type: 'service', status: 'active', startDate: '2026-01-15', endDate: '2026-07-15', value: 25000, autoRenew: false },
]

const mockBAAs: BAA[] = [
  { id: '1', vendor: 'CloudMedix', status: 'active', version: 2, effectiveDate: '2025-01-01', expirationDate: '2026-12-31', phiScope: 'All patient records, diagnostic data, billing information' },
  { id: '2', vendor: 'HealthSync', status: 'active', version: 1, effectiveDate: '2025-06-01', expirationDate: '2026-05-31', phiScope: 'Patient demographics, treatment records' },
  { id: '3', vendor: 'DataVault Pro', status: 'pending_signature', version: 1, effectiveDate: '2026-04-01', expirationDate: '2027-03-31', phiScope: 'Encrypted backup data containing PHI' },
  { id: '4', vendor: 'MedSecure', status: 'draft', version: 1, effectiveDate: '', expirationDate: '', phiScope: 'Security audit logs potentially containing PHI identifiers' },
]

// --- Helpers ---

function getContractStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200'
    case 'pending_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'expired': return 'bg-red-100 text-red-800 border-red-200'
    case 'terminated': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'renewed': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getBaaStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200'
    case 'pending_signature': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'pending_review': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'expired': return 'bg-red-100 text-red-800 border-red-200'
    case 'terminated': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'amended': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function isExpiringSoon(endDate: string) {
  const end = new Date(endDate)
  const now = new Date()
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 90
}

// --- Component ---

export default function ContractsPage() {
  const [isLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'contracts' | 'baa'>('contracts')
  const [search, setSearch] = useState('')

  const filteredContracts = useMemo(() => {
    if (!search) return mockContracts
    return mockContracts.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.vendor.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const filteredBAAs = useMemo(() => {
    if (!search) return mockBAAs
    return mockBAAs.filter(
      (b) =>
        b.vendor.toLowerCase().includes(search.toLowerCase()) ||
        b.phiScope.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts & BAAs</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor contracts and Business Associate Agreements
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'contracts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('contracts')}
        >
          Contracts
        </button>
        <button
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'baa'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('baa')}
        >
          Business Associate Agreements
        </button>
      </div>

      {/* Search + Add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'contracts' ? 'Search contracts...' : 'Search BAAs...'}
            className="h-8 w-72 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="default">
          <Plus className="size-4" />
          {activeTab === 'contracts' ? 'Add Contract' : 'New BAA'}
        </Button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <Card>
          <CardContent className="p-0">
            {filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No contracts found</h3>
                <p className="text-sm text-muted-foreground">
                  Get started by adding your first vendor contract
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Auto Renew</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const expiring = contract.status === 'active' && isExpiringSoon(contract.endDate)
                    return (
                      <TableRow
                        key={contract.id}
                        className={expiring ? 'bg-yellow-50/50' : undefined}
                      >
                        <TableCell>
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {contract.title}
                          </Link>
                          {expiring && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="size-3" />
                              Expiring soon
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{contract.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatLabel(contract.type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getContractStatusColor(contract.status)}`}>
                            {formatLabel(contract.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(contract.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(contract.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(contract.value)}
                        </TableCell>
                        <TableCell>
                          {contract.autoRenew ? (
                            <RefreshCw className="size-4 text-green-600" />
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/contracts/${contract.id}`} aria-label="View" className={buttonVariants({ variant: "ghost", size: "icon-xs" })}>
                                <Eye className="size-3.5" />
                            </Link>
                            <Button variant="ghost" size="icon-xs" aria-label="Edit">
                              <FileEdit className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* BAA Tab */}
      {activeTab === 'baa' && (
        <Card>
          <CardContent className="p-0">
            {filteredBAAs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No BAAs found</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new Business Associate Agreement to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>PHI Scope</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBAAs.map((baa) => (
                    <TableRow key={baa.id}>
                      <TableCell className="font-medium">{baa.vendor}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getBaaStatusColor(baa.status)}`}>
                          {formatLabel(baa.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">v{baa.version}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {baa.effectiveDate ? new Date(baa.effectiveDate).toLocaleDateString() : '--'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {baa.expirationDate ? new Date(baa.expirationDate).toLocaleDateString() : '--'}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                        {baa.phiScope || '--'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-xs" aria-label="View">
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
      )}
    </div>
  )
}
