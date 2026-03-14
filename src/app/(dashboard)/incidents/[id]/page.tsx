'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle,
  ShieldX,
  Clock,
  User,
  Building2,
  Calendar,
  Server,
  Send,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

// --- Mock Data ---

const mockIncident = {
  id: '1',
  title: 'Unauthorized PHI Access Detected',
  description: 'Anomalous database queries detected from vendor CloudMedix API integration. Multiple SELECT queries on patient_records table from an unauthorized IP address associated with the vendor network. Investigation indicates potential credential compromise.',
  vendor: 'CloudMedix',
  severity: 'critical' as const,
  status: 'investigating' as const,
  category: 'Unauthorized Access',
  affectedSystems: ['Patient Records Database', 'EHR Integration API', 'Audit Log System'],
  phiCompromised: true,
  individualsAffected: 1250,
  breachDetails: 'Patient demographics, diagnosis codes, and treatment records may have been accessed through compromised API credentials.',
  reportedBy: 'Sarah Chen',
  assignedTo: 'Mike Johnson',
  reportedAt: '2026-03-12T14:30:00Z',
  updatedAt: '2026-03-13T10:45:00Z',
  resolvedAt: null,
  timeline: [
    { id: '1', user: 'Sarah Chen', content: 'Initial incident reported. Anomalous query patterns detected by automated monitoring.', isInternal: false, createdAt: '2026-03-12T14:30:00Z' },
    { id: '2', user: 'Mike Johnson', content: 'Investigation started. Isolating vendor API access pending review. Contacted CloudMedix security team.', isInternal: false, createdAt: '2026-03-12T15:00:00Z' },
    { id: '3', user: 'Sarah Chen', content: 'Internal note: HHS breach notification assessment in progress. Legal team notified.', isInternal: true, createdAt: '2026-03-12T16:00:00Z' },
    { id: '4', user: 'Mike Johnson', content: 'CloudMedix confirmed compromised API key. Key has been revoked. Forensic analysis of access logs underway.', isInternal: false, createdAt: '2026-03-13T09:00:00Z' },
    { id: '5', user: 'Emily Davis', content: 'Preliminary assessment: 1,250 patient records potentially accessed. Working on individual notification plan.', isInternal: false, createdAt: '2026-03-13T10:45:00Z' },
  ],
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'reported': return 'bg-red-100 text-red-800 border-red-200'
    case 'investigating': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'contained': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'remediation': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
    case 'closed': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading] = useState(false)
  const [updateContent, setUpdateContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const incident = mockIncident

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push('/incidents')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
          </div>
          <div className="ml-10 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
              {formatLabel(incident.severity)} Severity
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(incident.status)}`}>
              {formatLabel(incident.status)}
            </span>
            {incident.phiCompromised && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                <ShieldX className="size-3" /> PHI Breach
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default">
            Update Status
          </Button>
          <Button variant="outline" size="default">
            <User className="size-4" />
            Assign
          </Button>
          <Button size="default">
            <CheckCircle2 className="size-4" />
            Resolve
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-1 text-sm font-semibold text-muted-foreground">Description</h4>
              <p className="text-sm leading-relaxed">{incident.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{incident.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vendor</p>
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{incident.vendor || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reported By</p>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span>{incident.reportedBy}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span>{incident.assignedTo || 'Unassigned'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reported At</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{new Date(incident.reportedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{new Date(incident.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Affected Systems */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Affected Systems</h4>
              <div className="flex flex-wrap gap-2">
                {incident.affectedSystems.map((system) => (
                  <span
                    key={system}
                    className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium"
                  >
                    <Server className="size-3" />
                    {system}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PHI Breach Info */}
        <div className="space-y-6">
          {incident.phiCompromised && (
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <ShieldX className="size-5" />
                  PHI Breach Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-red-700/70">Individuals Affected</p>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-red-600" />
                    <span className="text-2xl font-bold text-red-800">
                      {incident.individualsAffected.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-red-700/70">Breach Details</p>
                  <p className="text-sm leading-relaxed text-red-800">{incident.breachDetails}</p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-100/50 p-3">
                  <p className="text-xs font-semibold text-red-800">HIPAA Notification Required</p>
                  <p className="mt-1 text-xs text-red-700">
                    Breaches affecting 500+ individuals require notification to HHS within 60 days.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="default">
                <AlertTriangle className="size-4" />
                Escalate Incident
              </Button>
              <Button variant="outline" className="w-full justify-start" size="default">
                <User className="size-4" />
                Reassign
              </Button>
              <Button variant="outline" className="w-full justify-start" size="default">
                <Building2 className="size-4" />
                Contact Vendor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Timeline</CardTitle>
          <CardDescription>Chronological log of all incident updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {incident.timeline.map((entry, index) => (
              <div key={entry.id} className="relative flex gap-4">
                {index < incident.timeline.length - 1 && (
                  <div className="absolute left-[15px] top-8 h-[calc(100%+8px)] w-px bg-border" />
                )}
                <div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${entry.isInternal ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  <User className={`size-4 ${entry.isInternal ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{entry.user}</span>
                    {entry.isInternal && (
                      <Badge variant="outline" className="text-[10px]">Internal</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{entry.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Update Form */}
          <div className="mt-8 rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold">Add Update</h4>
            <div className="space-y-3">
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter update details..."
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(checked)}
                  />
                  <Label className="text-sm">Internal note (not visible to vendor)</Label>
                </div>
                <Button size="default" disabled={!updateContent.trim()}>
                  <Send className="size-4" />
                  Post Update
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
