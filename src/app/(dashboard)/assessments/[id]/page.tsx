'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RiskScoreGauge } from '@/components/assessments/risk-score-gauge'
import {
  AssessmentQuestionnaire,
  type Section,
  type QuestionResponse,
} from '@/components/assessments/assessment-questionnaire'
import type { RiskAssessment, RiskLevel, AssessmentStatus } from '@/types'
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Download,
  Send,
  Check,
  Building2,
  Calendar,
  User,
} from 'lucide-react'

const TABS = [
  { id: 'responses', label: 'Questions & Responses', icon: ClipboardCheck },
  { id: 'findings', label: 'Findings', icon: AlertTriangle },
  { id: 'recommendations', label: 'Recommendations', icon: ListChecks },
  { id: 'remediation', label: 'Remediation Tasks', icon: CheckCircle2 },
] as const

type TabId = (typeof TABS)[number]['id']

function StatusBadge({ status }: { status: AssessmentStatus }) {
  const config: Record<AssessmentStatus, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
    in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    expired: { label: 'Expired', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
  }
  const c = config[status] ?? config.draft
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', c.className)}>
      {c.label}
    </span>
  )
}

interface AssessmentData extends RiskAssessment {
  vendors?: { name: string } | null
}

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.id as string

  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('responses')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`)
        if (res.ok) {
          const body = await res.json()
          setAssessment(body.data ?? body)
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assessmentId])

  if (loading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16">
        <ClipboardCheck className="size-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Assessment not found</h2>
        <Button variant="outline" onClick={() => router.push('/assessments')}>
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Assessments
        </Button>
      </div>
    )
  }

  const isCompleted = assessment.status === 'completed'
  const score = assessment.risk_score ?? 0
  const findings = (assessment.findings as any) ?? {}
  const savedResponses: QuestionResponse[] = findings.responses ?? []

  // Reconstruct responses map for the questionnaire
  const responsesMap: Record<string, QuestionResponse> = {}
  savedResponses.forEach((r: any) => {
    responsesMap[r.question_id] = {
      question_id: r.question_id,
      question_text: r.question_text,
      score: r.score,
      notes: r.notes ?? '',
      evidence_urls: r.evidence_urls ?? [],
    }
  })

  // Build sections from framework if available
  const frameworkSections = buildSectionsFromFindings(findings, assessment.framework)

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Back */}
      <button
        onClick={() => router.push('/assessments')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Assessments
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>
            <StatusBadge status={assessment.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {(assessment as any).vendors?.name && (
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {(assessment as any).vendors.name}
              </span>
            )}
            {assessment.framework && (
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                {assessment.framework.toUpperCase()}
              </span>
            )}
            {assessment.due_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Due: {new Date(assessment.due_date).toLocaleDateString()}
              </span>
            )}
            {assessment.assessor_id && (
              <span className="flex items-center gap-1.5">
                <User className="size-3.5" />
                Assessor assigned
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {assessment.status === 'draft' || assessment.status === 'in_progress' ? (
            <Button size="sm">
              <Send className="mr-1.5 size-3.5" />
              Submit for Review
            </Button>
          ) : assessment.status === 'under_review' ? (
            <Button size="sm">
              <Check className="mr-1.5 size-3.5" />
              Complete Assessment
            </Button>
          ) : null}
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Completed: show risk score card */}
      {isCompleted && (
        <div className="flex flex-col items-center rounded-xl border bg-card p-8">
          <RiskScoreGauge score={score} riskLevel={assessment.risk_level} size="lg" />
          <p className="mt-4 text-sm text-muted-foreground">
            Completed on{' '}
            {assessment.completed_at
              ? new Date(assessment.completed_at).toLocaleDateString()
              : '--'}
          </p>
        </div>
      )}

      {/* Summary cards */}
      {!isCompleted && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Risk Score"
            value={assessment.risk_score !== null ? String(assessment.risk_score) : '--'}
          />
          <SummaryCard
            label="Risk Level"
            value={assessment.risk_level ? assessment.risk_level.charAt(0).toUpperCase() + assessment.risk_level.slice(1) : '--'}
          />
          <SummaryCard
            label="Questions Answered"
            value={`${findings.answered_questions ?? 0}/${findings.total_questions ?? 0}`}
          />
          <SummaryCard
            label="Framework"
            value={assessment.framework?.toUpperCase() ?? '--'}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'responses' && (
        <div>
          {frameworkSections.length > 0 ? (
            <AssessmentQuestionnaire
              sections={frameworkSections}
              responses={responsesMap}
              onChange={() => {}}
              readOnly={isCompleted || assessment.status === 'under_review'}
            />
          ) : (
            <EmptyTabState
              title="No responses recorded"
              description="Question responses will appear here once the assessment questionnaire is completed."
            />
          )}
        </div>
      )}

      {activeTab === 'findings' && (
        <div>
          {assessment.description ? (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-3 text-sm font-semibold">Assessment Findings</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {assessment.description}
              </p>
            </div>
          ) : (
            <EmptyTabState
              title="No findings yet"
              description="Findings will be documented here as the assessment progresses."
            />
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div>
          {assessment.recommendations ? (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="mb-3 text-sm font-semibold">Recommendations</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(assessment.recommendations, null, 2)}
              </p>
            </div>
          ) : (
            <EmptyTabState
              title="No recommendations yet"
              description="Recommendations will be provided upon assessment completion."
            />
          )}
        </div>
      )}

      {activeTab === 'remediation' && (
        <EmptyTabState
          title="No remediation tasks"
          description="Remediation tasks will be created based on assessment findings and recommendations."
        />
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function EmptyTabState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// Helper to reconstruct sections from saved responses for display
function buildSectionsFromFindings(findings: any, framework: string | null): Section[] {
  const responses: any[] = findings?.responses ?? []
  if (responses.length === 0) return []

  // Group by category prefix
  const grouped: Record<string, { id: string; text: string }[]> = {}
  responses.forEach((r: any) => {
    const parts = r.question_id?.split('-') ?? []
    const sectionKey = parts.slice(0, -1).join('-') || 'general'
    if (!grouped[sectionKey]) grouped[sectionKey] = []
    grouped[sectionKey].push({
      id: r.question_id,
      text: r.question_text,
    })
  })

  return Object.entries(grouped).map(([key, questions]) => ({
    id: key,
    title: key
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    questions,
  }))
}
