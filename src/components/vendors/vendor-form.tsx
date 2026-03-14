'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import type { Vendor } from '@/types'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'

const vendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  primary_contact_name: z.string().optional(),
  primary_contact_email: z.string().email('Must be a valid email').or(z.literal('')).optional(),
  primary_contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  hipaa_compliant: z.boolean().optional(),
  soc2_certified: z.boolean().optional(),
  hitrust_certified: z.boolean().optional(),
  data_types_shared: z.array(z.string()).optional(),
  services_provided: z.string().optional(),
})

type VendorFormData = z.infer<typeof vendorSchema>

const CATEGORIES = [
  'EHR/EMR',
  'Cloud Services',
  'Billing & Revenue',
  'Telehealth',
  'Lab Services',
  'Imaging',
  'Pharmacy',
  'IT Infrastructure',
  'Consulting',
  'Data Analytics',
  'Security',
  'Other',
]

const DATA_CLASSIFICATIONS = [
  'PHI',
  'ePHI',
  'PII',
  'Financial',
  'Clinical',
  'Administrative',
  'De-identified',
]

interface VendorFormProps {
  vendor?: Vendor | null
  open: boolean
  onClose: () => void
  onSuccess?: (vendor: Vendor) => void
}

export function VendorForm({ vendor, open, onClose, onSuccess }: VendorFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(
    vendor?.data_classification ?? []
  )

  const isEdit = !!vendor

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VendorFormData>({
    defaultValues: {
      name: vendor?.name ?? '',
      website: vendor?.website ?? '',
      category: vendor?.category ?? '',
      description: vendor?.description ?? '',
      primary_contact_name: vendor?.primary_contact_name ?? '',
      primary_contact_email: vendor?.primary_contact_email ?? '',
      primary_contact_phone: vendor?.primary_contact_phone ?? '',
      address: vendor?.address ?? '',
      city: vendor?.city ?? '',
      state: vendor?.state ?? '',
      zip_code: vendor?.zip_code ?? '',
      hipaa_compliant: vendor?.hipaa_compliant ?? false,
      soc2_certified: vendor?.soc2_certified ?? false,
      hitrust_certified: vendor?.hitrust_certified ?? false,
      services_provided: (vendor as any)?.services_provided ?? '',
    },
  })

  const onSubmit = async (formData: VendorFormData) => {
    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        data_types_shared: selectedDataTypes,
        website: formData.website || null,
        primary_contact_email: formData.primary_contact_email || null,
      }

      const url = isEdit ? `/api/vendors/${vendor.id}` : '/api/vendors'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to save vendor')
      }

      const result = await res.json()
      reset()
      onSuccess?.(result.data ?? result)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDataType = (dt: string) => {
    setSelectedDataTypes((prev) =>
      prev.includes(dt) ? prev.filter((x) => x !== dt) : [...prev, dt]
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              Basic Information
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.name && 'border-red-500'
                  )}
                  placeholder="Enter vendor name"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Website</label>
                <input
                  {...register('website')}
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.website && 'border-red-500'
                  )}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Category</label>
                <select
                  {...register('category')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Describe the vendor and services provided"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Services Provided
              </label>
              <input
                {...register('services_provided')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., Cloud hosting, Data analytics"
              />
            </div>
          </fieldset>

          {/* Contact Info */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              Primary Contact
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name</label>
                <input
                  {...register('primary_contact_name')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  {...register('primary_contact_email')}
                  type="email"
                  className={cn(
                    'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20',
                    errors.primary_contact_email && 'border-red-500'
                  )}
                  placeholder="contact@vendor.com"
                />
                {errors.primary_contact_email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.primary_contact_email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Phone</label>
                <input
                  {...register('primary_contact_phone')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">Address</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  {...register('address')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Street address"
                />
              </div>
              <div>
                <input
                  {...register('city')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  {...register('state')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="State"
                />
                <input
                  {...register('zip_code')}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="ZIP"
                />
              </div>
            </div>
          </fieldset>

          {/* Compliance & Data */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              Compliance & Data Access
            </legend>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('hipaa_compliant')}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm">HIPAA Compliant</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('soc2_certified')}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm">SOC 2 Compliant</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('hitrust_certified')}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm">HITRUST Certified</span>
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Data Classification
              </label>
              <div className="flex flex-wrap gap-2">
                {DATA_CLASSIFICATIONS.map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => toggleDataType(dt)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      selectedDataTypes.includes(dt)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
