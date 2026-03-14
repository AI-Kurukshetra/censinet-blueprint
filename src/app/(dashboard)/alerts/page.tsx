'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  FileText,
  Shield,
  Clock,
  ShieldAlert,
  Building2,
  X,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGlobalLoader } from '@/components/shared/global-loader-provider'
import type { Database } from '@/types/database'

// --- Types ---

type AlertType =
  | 'contract_expiring'
  | 'baa_expiring'
  | 'assessment_due'
  | 'compliance_gap'
  | 'incident_reported'
  | 'risk_score_change'
  | 'document_expiring'
  | 'remediation_overdue'
  | 'vendor_status_change'
  | 'system'

type AlertPriority = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface Alert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  message: string
  source: string | null
  referenceType: string | null
  isRead: boolean
  createdAt: string
}

type AlertRow = Database['public']['Tables']['alerts']['Row']

// --- Helpers ---

function getPriorityColor(priority: AlertPriority) {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'info': return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getAlertIcon(type: AlertType) {
  switch (type) {
    case 'incident_reported': return <ShieldAlert className="size-5 text-red-600" />
    case 'contract_expiring': case 'baa_expiring': return <FileText className="size-5 text-orange-600" />
    case 'compliance_gap': return <Shield className="size-5 text-yellow-600" />
    case 'assessment_due': return <Clock className="size-5 text-blue-600" />
    case 'risk_score_change': return <AlertTriangle className="size-5 text-orange-600" />
    case 'document_expiring': return <FileText className="size-5 text-blue-600" />
    case 'remediation_overdue': return <Clock className="size-5 text-red-600" />
    case 'vendor_status_change': return <Building2 className="size-5 text-purple-600" />
    case 'system': return <Bell className="size-5 text-gray-600" />
  }
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// --- Component ---

export default function AlertsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'critical' | 'high'>('all')
  const { withLoader } = useGlobalLoader()

  const mapAlert = useCallback((row: AlertRow): Alert => ({
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message ?? '',
    source: row.source,
    referenceType: row.reference_type,
    isRead: row.is_read,
    createdAt: row.created_at,
  }), [])

  const fetchAlerts = useCallback(async () => {
    await withLoader(async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/alerts?per_page=100', { cache: 'no-store' })
        if (!res.ok) return

        const payload = (await res.json()) as { data?: AlertRow[] }
        setAlerts((payload.data ?? []).map(mapAlert))
      } finally {
        setIsLoading(false)
      }
    })
  }, [mapAlert, withLoader])

  useEffect(() => {
    void fetchAlerts()
  }, [fetchAlerts])

  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case 'unread': return alerts.filter((a) => !a.isRead)
      case 'critical': return alerts.filter((a) => a.priority === 'critical')
      case 'high': return alerts.filter((a) => a.priority === 'high')
      default: return alerts
    }
  }, [alerts, activeTab])

  const unreadCount = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts])

  async function markAsRead(id: string) {
    setMarkingReadIds((prev) => new Set(prev).add(id))

    try {
      const res = await withLoader(async () => {
        return await fetch('/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      })

      if (!res.ok) return
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)))
    } finally {
      setMarkingReadIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  function dismissAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  async function markAllRead() {
    setMarkingAllRead(true)

    try {
      const res = await withLoader(async () => {
        return await fetch('/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        })
      })

      if (!res.ok) return
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
    } finally {
      setMarkingAllRead(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0 || markingAllRead}>
          <CheckCheck className="size-4" />
          Mark All Read
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(['all', 'unread', 'critical', 'high'] as const).map((tab) => (
          <button
            key={tab}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All' : tab === 'unread' ? `Unread (${unreadCount})` : formatLabel(tab)}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BellOff className="mb-4 size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No alerts</h3>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'all'
                ? 'You have no notifications at this time'
                : `No ${activeTab} alerts found`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`transition-colors ${!alert.isRead ? 'border-l-4 border-l-primary bg-primary/[0.02]' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`text-sm ${!alert.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {alert.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {alert.message}
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPriorityColor(alert.priority)}`}>
                        {formatLabel(alert.priority)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{timeAgo(alert.createdAt)}</span>
                        {alert.source && (
                          <>
                            <span>|</span>
                            <span>{alert.source}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.referenceType && (
                          <Button variant="ghost" size="xs" className="text-xs">
                            <ExternalLink className="size-3" />
                            View
                          </Button>
                        )}
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-xs"
                            onClick={() => markAsRead(alert.id)}
                            disabled={markingReadIds.has(alert.id)}
                          >
                            <Check className="size-3" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => dismissAlert(alert.id)}
                          aria-label="Dismiss"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
