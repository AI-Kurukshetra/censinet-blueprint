'use client'

import { useState, useCallback } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Upload, FileText, Check } from 'lucide-react'

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

interface UploadFormData {
  name: string
  description: string
  documentType: DocumentType
  vendorId: string
  tags: string[]
  expiryDate: string
  file: File | null
}

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: UploadFormData) => void
}

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'baa', label: 'BAA' },
  { value: 'contract', label: 'Contract' },
  { value: 'soc2_report', label: 'SOC 2 Report' },
  { value: 'penetration_test', label: 'Penetration Test' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const mockVendors = [
  { id: 'v1', name: 'CloudMedix' },
  { id: 'v2', name: 'HealthSync' },
  { id: 'v3', name: 'DataVault Pro' },
  { id: 'v4', name: 'MedSecure' },
  { id: 'v5', name: 'ComplianceHub' },
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- Component ---

export function UploadDialog({ open, onClose, onSubmit }: UploadDialogProps) {
  const [formData, setFormData] = useState<UploadFormData>({
    name: '',
    description: '',
    documentType: 'other',
    vendorId: '',
    tags: [],
    expiryDate: '',
    file: null,
  })

  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.file) newErrors.file = 'File is required'
    if (!formData.documentType) newErrors.documentType = 'Document type is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Simulate upload progress
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onSubmit(formData)
            setUploadProgress(null)
          }, 500)
          return 100
        }
        return prev + 20
      })
    }, 300)
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setFormData({ ...formData, file, name: formData.name || file.name.replace(/\.[^/.]+$/, '') })
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file) {
      setFormData({ ...formData, file, name: formData.name || file.name.replace(/\.[^/.]+$/, '') })
    }
  }

  function addTag() {
    const trimmed = tagInput.trim()
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmed] })
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background shadow-lg">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* File Drop Zone */}
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
          >
            {formData.file ? (
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{formData.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(formData.file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setFormData({ ...formData, file: null })}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drag and drop your file here</p>
                <p className="mb-3 text-xs text-muted-foreground">or</p>
                <label className="cursor-pointer">
                  <span className={buttonVariants({ variant: "outline", size: "sm" })}>Choose File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-[10px] text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG (max 25MB)</p>
              </>
            )}
          </div>
          {errors.file && <p className="text-xs text-red-600">{errors.file}</p>}

          {/* Upload Progress */}
          {uploadProgress !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadProgress === 100 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="size-3" /> Upload complete
                </div>
              )}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Document Name *</Label>
            <Input
              id="name"
              placeholder="Enter document name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of the document..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <select
              id="documentType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
            >
              {documentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendorId">Vendor (optional)</Label>
            <select
              id="vendorId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.vendorId}
              onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            >
              <option value="">No vendor</option>
              {mockVendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <Button type="button" variant="outline" size="default" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadProgress !== null}>
              <Upload className="size-4" />
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
