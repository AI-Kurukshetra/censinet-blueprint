'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle,
  X,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// --- Types ---

interface IncidentFormData {
  title: string
  description: string
  severity: string
  category: string
  vendorId: string
  affectedSystems: string[]
  phiCompromised: boolean
  individualsAffected: string
}

const severities = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const categories = [
  'Unauthorized Access',
  'Data Breach',
  'System Outage',
  'Malware/Ransomware',
  'Phishing',
  'Insider Threat',
  'Configuration Error',
  'Vendor Non-Compliance',
  'Other',
]

const mockVendors = [
  { id: 'v1', name: 'CloudMedix' },
  { id: 'v2', name: 'HealthSync' },
  { id: 'v3', name: 'DataVault Pro' },
  { id: 'v4', name: 'MedSecure' },
  { id: 'v5', name: 'ComplianceHub' },
]

export default function NewIncidentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<IncidentFormData>({
    title: '',
    description: '',
    severity: 'medium',
    category: '',
    vendorId: '',
    affectedSystems: [],
    phiCompromised: false,
    individualsAffected: '',
  })
  const [systemInput, setSystemInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function addSystem() {
    const trimmed = systemInput.trim()
    if (trimmed && !formData.affectedSystems.includes(trimmed)) {
      setFormData({
        ...formData,
        affectedSystems: [...formData.affectedSystems, trimmed],
      })
      setSystemInput('')
    }
  }

  function removeSystem(system: string) {
    setFormData({
      ...formData,
      affectedSystems: formData.affectedSystems.filter((s) => s !== system),
    })
  }

  function handleSystemKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSystem()
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.severity) newErrors.severity = 'Severity is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (formData.phiCompromised && !formData.individualsAffected) {
      newErrors.individualsAffected = 'Number of individuals affected is required when PHI is compromised'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      router.push('/incidents')
    }, 1000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push('/incidents')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report New Incident</h1>
          <p className="text-sm text-muted-foreground">
            Document a security incident or PHI breach
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Incident Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Provide a detailed description of the incident, including what happened, when it was discovered, and initial observations..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            </div>

            {/* Severity + Category */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <select
                  id="severity"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  {severities.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errors.severity && <p className="text-xs text-red-600">{errors.severity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
              </div>
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
                <option value="">Select a vendor (if applicable)</option>
                {mockVendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Affected Systems */}
            <div className="space-y-2">
              <Label>Affected Systems</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add affected system..."
                  value={systemInput}
                  onChange={(e) => setSystemInput(e.target.value)}
                  onKeyDown={handleSystemKeyDown}
                />
                <Button type="button" variant="outline" size="default" onClick={addSystem}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {formData.affectedSystems.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.affectedSystems.map((system) => (
                    <span
                      key={system}
                      className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium"
                    >
                      {system}
                      <button
                        type="button"
                        onClick={() => removeSystem(system)}
                        className="ml-0.5 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* PHI Section */}
            <div className="space-y-4 rounded-lg border border-red-200 bg-red-50/30 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.phiCompromised}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      phiCompromised: checked,
                      individualsAffected: checked ? formData.individualsAffected : '',
                    })
                  }
                />
                <Label className="cursor-pointer font-semibold text-red-800">
                  Protected Health Information (PHI) was compromised
                </Label>
              </div>

              {formData.phiCompromised && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="individualsAffected">
                    Estimated Number of Individuals Affected *
                  </Label>
                  <Input
                    id="individualsAffected"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.individualsAffected}
                    onChange={(e) =>
                      setFormData({ ...formData, individualsAffected: e.target.value })
                    }
                    className="max-w-xs"
                  />
                  {errors.individualsAffected && (
                    <p className="text-xs text-red-600">{errors.individualsAffected}</p>
                  )}
                  <p className="text-xs text-red-700">
                    Note: Breaches affecting 500+ individuals must be reported to HHS within 60 days per HIPAA.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/incidents')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-4" />
                    Report Incident
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
