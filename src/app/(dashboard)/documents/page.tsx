'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { UploadDialog } from '@/components/documents/upload-dialog'
import { useGlobalLoader } from '@/components/shared/global-loader-provider'

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

interface VendorOption {
  id: string
  name: string
}

interface DocumentRow {
  id: string
  vendor_id: string | null
  uploaded_by: string
  name: string
  description: string | null
  document_type: DocumentType
  file_url: string
  file_size: number | null
  created_at: string
  expires_at: string | null
}

const documentTypes: DocumentType[] = [
  'policy',
  'procedure',
  'certificate',
  'audit_report',
  'baa',
  'contract',
  'soc2_report',
  'penetration_test',
  'risk_assessment',
  'insurance',
  'other',
]

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatFileSize(bytes: number | null) {
  if (bytes === null) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDocTypeColor(type: DocumentType) {
  switch (type) {
    case 'policy':
    case 'procedure':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'certificate':
    case 'insurance':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'audit_report':
    case 'soc2_report':
    case 'penetration_test':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'baa':
    case 'contract':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'risk_assessment':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getDocIcon(type: DocumentType) {
  switch (type) {
    case 'certificate':
    case 'insurance':
      return <FileCheck className="size-5" />
    case 'baa':
    case 'contract':
      return <FileLock2 className="size-5" />
    case 'risk_assessment':
    case 'penetration_test':
      return <FileWarning className="size-5" />
    default:
      return <FileText className="size-5" />
  }
}

export default function DocumentsPage() {
  const { withLoader } = useGlobalLoader()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [vendorFilter, setVendorFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])

  const loadData = useCallback(async () => {
    await withLoader(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [docsRes, vendorsRes] = await Promise.all([
          fetch('/api/documents?per_page=200'),
          fetch('/api/vendors?per_page=200'),
        ])

        const [docsJson, vendorsJson] = await Promise.all([docsRes.json(), vendorsRes.json()])

        if (!docsRes.ok || !vendorsRes.ok) {
          throw new Error(docsJson?.error || vendorsJson?.error || 'Failed to load documents')
        }

        setDocuments(docsJson?.data ?? [])
        setVendors((vendorsJson?.data ?? []).map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents')
      } finally {
        setIsLoading(false)
      }
    })
  }, [withLoader])

  useEffect(() => {
    loadData()
  }, [loadData])

  const vendorNameById = useMemo(() => {
    return new Map(vendors.map((v) => [v.id, v.name]))
  }, [vendors])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false
      const vendorName = doc.vendor_id ? vendorNameById.get(doc.vendor_id) ?? '' : ''
      if (vendorFilter !== 'all' && vendorName !== vendorFilter) return false
      if (
        search &&
        !doc.name.toLowerCase().includes(search.toLowerCase()) &&
        !(doc.description ?? '').toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [documents, search, typeFilter, vendorFilter, vendorNameById])

  async function handleUpload(data: {
    name: string
    description: string
    documentType: DocumentType
    vendorId: string
    tags: string[]
    expiryDate: string
    file: File | null
  }) {
    if (!data.file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('document_type', data.documentType)
      formData.append('vendor_id', data.vendorId)
      formData.append('tags', JSON.stringify(data.tags))
      formData.append('expires_at', data.expiryDate)

      const response = await withLoader(async () => {
        return await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to upload document')
      }

      setShowUploadDialog(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage compliance documents, contracts, and vendor certifications
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} disabled={isUploading}>
          <Plus className="size-4" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

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
                <option key={t} value={t}>
                  {formatLabel(t)}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
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

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No documents found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or upload a new document</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const vendorName = doc.vendor_id ? vendorNameById.get(doc.vendor_id) ?? '--' : '--'
            return (
              <Card key={doc.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${getDocTypeColor(doc.document_type).split(' ')[0]}`}
                    >
                      {getDocIcon(doc.document_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{doc.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{doc.description ?? '--'}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDocTypeColor(doc.document_type)}`}
                      >
                        {formatLabel(doc.document_type)}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                    </div>

                    <p className="text-xs text-muted-foreground">Vendor: {vendorName}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>Uploaded</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 border-t pt-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon-xs" aria-label="View">
                        <Eye className="size-3.5" />
                      </Button>
                    </a>
                    <a href={doc.file_url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="icon-xs" aria-label="Download">
                        <Download className="size-3.5" />
                      </Button>
                    </a>
                    <Button variant="ghost" size="icon-xs" aria-label="Delete" className="ml-auto text-red-600" disabled>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const vendorName = doc.vendor_id ? vendorNameById.get(doc.vendor_id) ?? '--' : '--'
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDocIcon(doc.document_type)}
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="max-w-[250px] truncate text-xs text-muted-foreground">{doc.description ?? '--'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDocTypeColor(doc.document_type)}`}
                        >
                          {formatLabel(doc.document_type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vendorName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">
                        {doc.expires_at ? (
                          <span className={new Date(doc.expires_at) < new Date() ? 'font-semibold text-red-600' : 'text-muted-foreground'}>
                            {new Date(doc.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <a href={doc.file_url} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon-xs" aria-label="Download">
                              <Download className="size-3.5" />
                            </Button>
                          </a>
                          <Button variant="ghost" size="icon-xs" aria-label="Delete" className="text-red-600" disabled>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSubmit={handleUpload}
        vendors={vendors}
      />
    </div>
  )
}
