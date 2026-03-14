'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Upload } from 'lucide-react'

// --- Types ---

interface BAAFormData {
  vendorId: string
  effectiveDate: string
  expirationDate: string
  phiScope: string
  safeguards: string
  breachNotificationTerms: string
  terminationTerms: string
  documentFile: File | null
}

interface BAAFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: BAAFormData) => void
  initialData?: Partial<BAAFormData>
  isEditing?: boolean
}

const mockVendors = [
  { id: 'v1', name: 'CloudMedix' },
  { id: 'v2', name: 'HealthSync' },
  { id: 'v3', name: 'DataVault Pro' },
  { id: 'v4', name: 'MedSecure' },
  { id: 'v5', name: 'ComplianceHub' },
]

// --- Component ---

export function BAAForm({ open, onClose, onSubmit, initialData, isEditing }: BAAFormProps) {
  const [formData, setFormData] = useState<BAAFormData>({
    vendorId: initialData?.vendorId || '',
    effectiveDate: initialData?.effectiveDate || '',
    expirationDate: initialData?.expirationDate || '',
    phiScope: initialData?.phiScope || '',
    safeguards: initialData?.safeguards || '',
    breachNotificationTerms: initialData?.breachNotificationTerms || '',
    terminationTerms: initialData?.terminationTerms || '',
    documentFile: null,
  })

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {}
    if (!formData.vendorId) newErrors.vendorId = 'Vendor is required'
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required'
    if (!formData.expirationDate) newErrors.expirationDate = 'Expiration date is required'
    if (formData.effectiveDate && formData.expirationDate && formData.effectiveDate > formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date must be after effective date'
    }
    if (!formData.phiScope.trim()) newErrors.phiScope = 'PHI scope is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, documentFile: file })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background shadow-lg">
        {/* Dialog Header */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit BAA' : 'New Business Associate Agreement'}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendorId">Vendor *</Label>
            <select
              id="vendorId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.vendorId}
              onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            >
              <option value="">Select a vendor</option>
              {mockVendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {errors.vendorId && <p className="text-xs text-red-600">{errors.vendorId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              />
              {errors.effectiveDate && <p className="text-xs text-red-600">{errors.effectiveDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
              {errors.expirationDate && <p className="text-xs text-red-600">{errors.expirationDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phiScope">PHI Scope *</Label>
            <textarea
              id="phiScope"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe the types of PHI that will be handled..."
              value={formData.phiScope}
              onChange={(e) => setFormData({ ...formData, phiScope: e.target.value })}
            />
            {errors.phiScope && <p className="text-xs text-red-600">{errors.phiScope}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="safeguards">Safeguards</Label>
            <textarea
              id="safeguards"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Describe administrative, physical, and technical safeguards..."
              value={formData.safeguards}
              onChange={(e) => setFormData({ ...formData, safeguards: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breachNotificationTerms">Breach Notification Terms</Label>
            <textarea
              id="breachNotificationTerms"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Specify breach notification requirements and timelines..."
              value={formData.breachNotificationTerms}
              onChange={(e) => setFormData({ ...formData, breachNotificationTerms: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terminationTerms">Termination Terms</Label>
            <textarea
              id="terminationTerms"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Specify termination conditions and data return/destruction..."
              value={formData.terminationTerms}
              onChange={(e) => setFormData({ ...formData, terminationTerms: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Document Upload</Label>
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
              <Upload className="size-5 text-muted-foreground" />
              <div className="flex-1">
                {formData.documentFile ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{formData.documentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.documentFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setFormData({ ...formData, documentFile: null })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                      Choose file
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create BAA'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
