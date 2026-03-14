'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  RefreshCw,
  FileEdit,
  Trash2,
  ExternalLink,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// --- Mock Data ---

const mockContract = {
  id: '1',
  title: 'Cloud Hosting Agreement',
  vendor: 'CloudMedix',
  vendorId: 'v1',
  type: 'service',
  status: 'active',
  startDate: '2025-01-01',
  endDate: '2026-12-31',
  renewalDate: '2026-10-01',
  value: 240000,
  autoRenew: true,
  terms: {
    paymentTerms: 'Net 30, billed quarterly',
    sla: '99.9% uptime guarantee with 4-hour response time for critical issues',
    terminationClause: 'Either party may terminate with 90 days written notice. Early termination fee of 3 months service.',
    dataHandling: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Data retained for 7 years per HIPAA requirements.',
    liabilityLimit: 'Limited to 12 months of service fees.',
  },
  documentUrl: '#',
  signedAt: '2024-12-15',
  baa: {
    id: 'baa-1',
    status: 'active',
    version: 2,
    effectiveDate: '2025-01-01',
    expirationDate: '2026-12-31',
    phiScope: 'All patient records, diagnostic data, billing information',
  },
  relatedDocuments: [
    { name: 'Signed Contract PDF', type: 'contract', url: '#' },
    { name: 'SOC 2 Type II Report', type: 'audit_report', url: '#' },
    { name: 'Insurance Certificate', type: 'insurance', url: '#' },
  ],
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200'
    case 'pending_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'expired': return 'bg-red-100 text-red-800 border-red-200'
    case 'terminated': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading] = useState(false)

  const contract = mockContract

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/contracts')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(contract.status)}`}>
              {formatLabel(contract.status)}
            </span>
          </div>
          <p className="ml-10 text-sm text-muted-foreground">
            Contract ID: {params.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default">
            <FileEdit className="size-4" />
            Edit
          </Button>
          <Button variant="outline" size="default">
            <RefreshCw className="size-4" />
            Renew
          </Button>
          <Button variant="destructive" size="default">
            <Trash2 className="size-4" />
            Terminate
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contract Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vendor</p>
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{contract.vendor}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Type</p>
                <Badge variant="outline">{formatLabel(contract.type)}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{new Date(contract.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">End Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contract Value</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{formatCurrency(contract.value)}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Auto Renew</p>
                <div className="flex items-center gap-2">
                  <RefreshCw className={`size-4 ${contract.autoRenew ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <span>{contract.autoRenew ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {contract.renewalDate && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{new Date(contract.renewalDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              {contract.signedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Signed At</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{new Date(contract.signedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Associated contract documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contract.relatedDocuments.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{formatLabel(doc.type)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-xs" aria-label="Download">
                    <Download className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Section */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(contract.terms).map(([key, value]) => (
              <div key={key}>
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  {formatLabel(key)}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Related BAA */}
      {contract.baa && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Associate Agreement</CardTitle>
                <CardDescription>Linked BAA for PHI handling</CardDescription>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(contract.baa.status)}`}>
                {formatLabel(contract.baa.status)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">v{contract.baa.version}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Effective Date</p>
                <p className="font-medium">{new Date(contract.baa.effectiveDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expiration Date</p>
                <p className="font-medium">{new Date(contract.baa.expirationDate).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">PHI Scope</p>
                <p className="text-sm">{contract.baa.phiScope}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
