'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Plus, Search, AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { ContractForm } from '@/components/contracts/contract-form'
import { BAAForm } from '@/components/contracts/baa-form'
import { useGlobalLoader } from '@/components/shared/global-loader-provider'

type Tab = 'contracts' | 'baa'

interface VendorOption {
  id: string
  name: string
}

interface ContractRow {
  id: string
  vendor_id: string
  title: string
  contract_type: string | null
  status: string
  start_date: string | null
  end_date: string | null
  value: number | null
  auto_renew: boolean
  vendors?: { name: string } | Array<{ name: string }> | null
}

interface BaaRow {
  id: string
  vendor_id: string
  status: string
  version: number
  effective_date: string | null
  expiration_date: string | null
  phi_scope: string | null
  vendors?: { name: string } | Array<{ name: string }> | null
}

function extractVendorName(
  vendor: { name: string } | Array<{ name: string }> | null | undefined
): string {
  if (!vendor) return '--'
  if (Array.isArray(vendor)) return vendor[0]?.name ?? '--'
  return vendor.name ?? '--'
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCurrency(value: number | null) {
  if (value === null) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

function isExpiringSoon(endDate: string | null) {
  if (!endDate) return false
  const end = new Date(endDate)
  const now = new Date()
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 90
}

export default function ContractsPage() {
  const { withLoader } = useGlobalLoader()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('contracts')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showContractForm, setShowContractForm] = useState(false)
  const [showBaaForm, setShowBaaForm] = useState(false)

  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [baas, setBaas] = useState<BaaRow[]>([])

  const loadData = useCallback(async () => {
    await withLoader(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [vendorsRes, contractsRes, baasRes] = await Promise.all([
          fetch('/api/vendors?per_page=100'),
          fetch('/api/contracts?per_page=100'),
          fetch('/api/contracts/baa?per_page=100'),
        ])

        const [vendorsJson, contractsJson, baasJson] = await Promise.all([
          vendorsRes.json(),
          contractsRes.json(),
          baasRes.json(),
        ])

        if (!vendorsRes.ok || !contractsRes.ok || !baasRes.ok) {
          throw new Error(
            vendorsJson?.error || contractsJson?.error || baasJson?.error || 'Failed to load contracts data'
          )
        }

        setVendors((vendorsJson?.data ?? []).map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })))
        setContracts(contractsJson?.data ?? [])
        setBaas(baasJson?.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contracts data')
      } finally {
        setIsLoading(false)
      }
    })
  }, [withLoader])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredContracts = useMemo(() => {
    if (!search) return contracts
    const q = search.toLowerCase()
    return contracts.filter((c) => {
      const vendorName = extractVendorName(c.vendors).toLowerCase()
      return c.title.toLowerCase().includes(q) || vendorName.includes(q)
    })
  }, [contracts, search])

  const filteredBAAs = useMemo(() => {
    if (!search) return baas
    const q = search.toLowerCase()
    return baas.filter((b) => {
      const vendorName = extractVendorName(b.vendors).toLowerCase()
      return vendorName.includes(q) || (b.phi_scope ?? '').toLowerCase().includes(q)
    })
  }, [baas, search])

  async function handleCreateContract(data: {
    title: string
    vendorId: string
    type: string
    startDate: string
    endDate: string
    value: string
    autoRenew: boolean
    terms: string
  }) {
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await withLoader(async () => {
        return await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor_id: data.vendorId,
            title: data.title,
            contract_type: data.type,
            start_date: data.startDate,
            end_date: data.endDate,
            value: data.value ? Number(data.value) : null,
            auto_renew: data.autoRenew,
            terms: data.terms ? { text: data.terms } : null,
          }),
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to create contract')
      }

      setShowContractForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateBaa(data: {
    vendorId: string
    effectiveDate: string
    expirationDate: string
    phiScope: string
    safeguards: string
    breachNotificationTerms: string
    terminationTerms: string
    documentFile: File | null
  }) {
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await withLoader(async () => {
        return await fetch('/api/contracts/baa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendor_id: data.vendorId,
            effective_date: data.effectiveDate,
            expiration_date: data.expirationDate,
            phi_scope: data.phiScope,
            safeguards: data.safeguards ? { text: data.safeguards } : null,
            breach_notification_terms: data.breachNotificationTerms
              ? { text: data.breachNotificationTerms }
              : null,
            termination_terms: data.terminationTerms ? { text: data.terminationTerms } : null,
          }),
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to create BAA')
      }

      setShowBaaForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create BAA')
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts & BAAs</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor contracts and Business Associate Agreements
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

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
        <Button
          size="default"
          onClick={() => (activeTab === 'contracts' ? setShowContractForm(true) : setShowBaaForm(true))}
          disabled={isSubmitting}
        >
          <Plus className="size-4" />
          {activeTab === 'contracts' ? 'Add Contract' : 'New BAA'}
        </Button>
      </div>

      {activeTab === 'contracts' && (
        <Card>
          <CardContent className="p-0">
            {filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No contracts found</h3>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => {
                    const expiring = contract.status === 'active' && isExpiringSoon(contract.end_date)
                    return (
                      <TableRow key={contract.id} className={expiring ? 'bg-yellow-50/50' : undefined}>
                        <TableCell>
                          <span className="font-medium">{contract.title}</span>
                          {expiring && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="size-3" />
                              Expiring soon
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{extractVendorName(contract.vendors)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatLabel(contract.contract_type ?? 'other')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatLabel(contract.status)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '--'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : '--'}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(contract.value)}</TableCell>
                        <TableCell>
                          {contract.auto_renew ? (
                            <RefreshCw className="size-4 text-green-600" />
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
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

      {activeTab === 'baa' && (
        <Card>
          <CardContent className="p-0">
            {filteredBAAs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 size-12 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold">No BAAs found</h3>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBAAs.map((baa) => (
                    <TableRow key={baa.id}>
                      <TableCell className="font-medium">{extractVendorName(baa.vendors)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatLabel(baa.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">v{baa.version}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {baa.effective_date ? new Date(baa.effective_date).toLocaleDateString() : '--'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {baa.expiration_date ? new Date(baa.expiration_date).toLocaleDateString() : '--'}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                        {baa.phi_scope || '--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <ContractForm
        open={showContractForm}
        onClose={() => setShowContractForm(false)}
        onSubmit={handleCreateContract}
        vendors={vendors}
      />

      <BAAForm
        open={showBaaForm}
        onClose={() => setShowBaaForm(false)}
        onSubmit={handleCreateBaa}
        vendors={vendors}
      />
    </div>
  )
}
