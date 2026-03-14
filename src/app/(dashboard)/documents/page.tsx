'use client'

import { useState, useMemo } from 'react'
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Download,
  Trash2,
  FileText,
  FileCheck,
  FileLock2,
  FileWarning,
  Eye,
  Calendar,
  User,
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

type DocumentType =
  | 'policy'
  | 'procedure'
  | 'certificate'
  | 'audit_report'
  | 'baa'
  | 'contract'
  | 'soc2_report'
  | 'penetration_test'
  | 'risk_assessment'
  | 'insurance'
  | 'other'

interface Document {
  id: string
  name: string
  description: string
  documentType: DocumentType
  vendor: string | null
  fileSize: number
  uploadedBy: string
  createdAt: string
  expiresAt: string | null
}

// --- Mock Data ---

const mockDocuments: Document[] = [
  { id: '1', name: 'HIPAA Security Policy v3.2', description: 'Organization-wide HIPAA security policies', documentType: 'policy', vendor: null, fileSize: 2450000, uploadedBy: 'Sarah Chen', createdAt: '2026-02-15T10:00:00Z', expiresAt: '2027-02-15T00:00:00Z' },
  { id: '2', name: 'CloudMedix SOC 2 Type II Report', description: 'Annual SOC 2 audit report', documentType: 'soc2_report', vendor: 'CloudMedix', fileSize: 5120000, uploadedBy: 'Mike Johnson', createdAt: '2026-01-20T14:30:00Z', expiresAt: '2027-01-20T00:00:00Z' },
  { id: '3', name: 'HealthSync BAA - Signed', description: 'Executed Business Associate Agreement', documentType: 'baa', vendor: 'HealthSync', fileSize: 890000, uploadedBy: 'Emily Davis', createdAt: '2025-06-01T09:00:00Z', expiresAt: '2026-05-31T00:00:00Z' },
  { id: '4', name: 'Annual Penetration Test Results', description: 'Q4 2025 penetration test findings', documentType: 'penetration_test', vendor: 'SecureTest Inc', fileSize: 3200000, uploadedBy: 'Mike Johnson', createdAt: '2026-01-05T11:00:00Z', expiresAt: null },
  { id: '5', name: 'DataVault Pro Service Agreement', description: 'Cloud backup service contract', documentType: 'contract', vendor: 'DataVault Pro', fileSize: 1560000, uploadedBy: 'Sarah Chen', createdAt: '2025-03-15T08:00:00Z', expiresAt: '2026-03-14T00:00:00Z' },
  { id: '6', name: 'Incident Response Procedure', description: 'Step-by-step IR playbook', documentType: 'procedure', vendor: null, fileSize: 750000, uploadedBy: 'Emily Davis', createdAt: '2026-03-01T16:00:00Z', expiresAt: null },
  { id: '7', name: 'Cyber Liability Insurance Certificate', description: 'Annual cyber insurance coverage', documentType: 'insurance', vendor: null, fileSize: 420000, uploadedBy: 'Sarah Chen', createdAt: '2026-01-10T10:00:00Z', expiresAt: '2027-01-10T00:00:00Z' },
  { id: '8', name: 'MedSecure Risk Assessment', description: 'Vendor risk assessment report', documentType: 'risk_assessment', vendor: 'MedSecure', fileSize: 1850000, uploadedBy: 'Mike Johnson', createdAt: '2026-02-28T13:00:00Z', expiresAt: null },
]

const documentTypes: DocumentType[] = [
  'policy', 'procedure', 'certificate', 'audit_report', 'baa',
  'contract', 'soc2_report', 'penetration_test', 'risk_assessment', 'insurance', 'other',
]

const vendorList = ['CloudMedix', 'HealthSync', 'DataVault Pro', 'MedSecure', 'SecureTest Inc']

// --- Helpers ---

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDocTypeColor(type: DocumentType) {
  switch (type) {
    case 'policy': case 'procedure': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'certificate': case 'insurance': return 'bg-green-100 text-green-800 border-green-200'
    case 'audit_report': case 'soc2_report': case 'penetration_test': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'baa': case 'contract': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'risk_assessment': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getDocIcon(type: DocumentType) {
  switch (type) {
    case 'certificate': case 'insurance': return <FileCheck className="size-5" />
    case 'baa': case 'contract': return <FileLock2 className="size-5" />
    case 'risk_assessment': case 'penetration_test': return <FileWarning className="size-5" />
    default: return <FileText className="size-5" />
  }
}

// --- Component ---

export default function DocumentsPage() {
  const [isLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false
      if (vendorFilter !== 'all' && (doc.vendor || '') !== vendorFilter) return false
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase()) && !doc.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [typeFilter, vendorFilter, search])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage compliance documents, contracts, and vendor certifications
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="size-4" />
          Upload Document
        </Button>
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {documentTypes.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
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
                placeholder="Search documents..."
                className="h-8 w-64 pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or upload a new document
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="group cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${getDocTypeColor(doc.documentType).split(' ')[0]}`}>
                    {getDocIcon(doc.documentType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{doc.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDocTypeColor(doc.documentType)}`}>
                      {formatLabel(doc.documentType)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                  </div>

                  {doc.vendor && (
                    <p className="text-xs text-muted-foreground">Vendor: {doc.vendor}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <span>{doc.uploadedBy}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1 border-t pt-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon-xs" aria-label="View">
                    <Eye className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Download">
                    <Download className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" aria-label="Delete" className="ml-auto text-red-600 hover:text-red-700">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocIcon(doc.documentType)}
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="max-w-[250px] truncate text-xs text-muted-foreground">{doc.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDocTypeColor(doc.documentType)}`}>
                        {formatLabel(doc.documentType)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.vendor || '--'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.uploadedBy}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {doc.expiresAt ? (
                        <span className={new Date(doc.expiresAt) < new Date() ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
                          {new Date(doc.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="Download">
                          <Download className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Delete" className="text-red-600 hover:text-red-700">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
