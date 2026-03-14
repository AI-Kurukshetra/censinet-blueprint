'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'

// --- Types ---

interface ContractFormData {
  title: string
  vendorId: string
  type: string
  startDate: string
  endDate: string
  value: string
  autoRenew: boolean
  terms: string
}

interface ContractFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ContractFormData) => void
  vendors?: Array<{ id: string; name: string }>
  initialData?: Partial<ContractFormData>
  isEditing?: boolean
}

const contractTypes = [
  { value: 'service', label: 'Service' },
  { value: 'license', label: 'License' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
]

const fallbackVendors = [
  { id: 'v1', name: 'CloudMedix' },
  { id: 'v2', name: 'HealthSync' },
  { id: 'v3', name: 'DataVault Pro' },
  { id: 'v4', name: 'MedSecure' },
  { id: 'v5', name: 'ComplianceHub' },
]

// --- Component ---

export function ContractForm({
  open,
  onClose,
  onSubmit,
  vendors,
  initialData,
  isEditing,
}: ContractFormProps) {
  const vendorOptions = vendors && vendors.length > 0 ? vendors : fallbackVendors

  const [formData, setFormData] = useState<ContractFormData>({
    title: initialData?.title || '',
    vendorId: initialData?.vendorId || '',
    type: initialData?.type || 'service',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    value: initialData?.value || '',
    autoRenew: initialData?.autoRenew || false,
    terms: initialData?.terms || '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ContractFormData, string>>>({})

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ContractFormData, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.vendorId) newErrors.vendorId = 'Vendor is required'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (formData.value && isNaN(Number(formData.value))) {
      newErrors.value = 'Value must be a valid number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 mx-4 w-full max-w-lg rounded-xl border bg-background shadow-lg">
        {/* Dialog Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Contract' : 'Add Contract'}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Cloud Hosting Agreement"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorId">Vendor *</Label>
            <select
              id="vendorId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.vendorId}
              onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            >
              <option value="">Select a vendor</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {errors.vendorId && <p className="text-xs text-red-600">{errors.vendorId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              {contractTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
              {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value ($)</Label>
            <Input
              id="value"
              type="number"
              placeholder="e.g., 50000"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            />
            {errors.value && <p className="text-xs text-red-600">{errors.value}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.autoRenew}
              onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
            />
            <Label htmlFor="autoRenew" className="cursor-pointer">
              Auto Renew
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms</Label>
            <textarea
              id="terms"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter contract terms and conditions..."
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
