'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AssessmentQuestionnaire,
  type Section,
  type QuestionResponse,
} from '@/components/assessments/assessment-questionnaire'
import type { Vendor } from '@/types'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Building2,
  Loader2,
  ClipboardCheck,
} from 'lucide-react'

const FRAMEWORKS = [
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
  },
  {
    id: 'soc2',
    name: 'SOC 2',
    description: 'Service Organization Control 2',
  },
  {
    id: 'hitrust',
    name: 'HITRUST CSF',
    description: 'Health Information Trust Alliance Common Security Framework',
  },
]

// Framework question templates
const FRAMEWORK_TEMPLATES: Record<string, Section[]> = {
  hipaa: [
    {
      id: 'admin-safeguards',
      title: 'Administrative Safeguards',
      description: 'Policies and procedures to manage the selection, development, implementation, and maintenance of security measures.',
      questions: [
        { id: 'h-a-1', text: 'Does the vendor have a designated HIPAA Security Officer?' },
        { id: 'h-a-2', text: 'Does the vendor conduct regular risk assessments of ePHI?' },
        { id: 'h-a-3', text: 'Does the vendor have workforce security policies including background checks?' },
        { id: 'h-a-4', text: 'Does the vendor have security awareness and training programs?' },
        { id: 'h-a-5', text: 'Does the vendor have incident response and reporting procedures?' },
        { id: 'h-a-6', text: 'Does the vendor have a contingency plan including data backup and disaster recovery?' },
      ],
    },
    {
      id: 'physical-safeguards',
      title: 'Physical Safeguards',
      description: 'Physical measures, policies, and procedures to protect electronic information systems.',
      questions: [
        { id: 'h-p-1', text: 'Does the vendor control physical access to facilities housing ePHI?' },
        { id: 'h-p-2', text: 'Does the vendor have workstation use and security policies?' },
        { id: 'h-p-3', text: 'Does the vendor have device and media controls for hardware containing ePHI?' },
        { id: 'h-p-4', text: 'Are data center physical security measures documented and tested?' },
      ],
    },
    {
      id: 'technical-safeguards',
      title: 'Technical Safeguards',
      description: 'Technology and related policies to protect ePHI and control access.',
      questions: [
        { id: 'h-t-1', text: 'Does the vendor implement unique user identification and access controls?' },
        { id: 'h-t-2', text: 'Does the vendor have audit controls to record and examine ePHI access?' },
        { id: 'h-t-3', text: 'Does the vendor ensure integrity of ePHI with mechanisms to authenticate data?' },
        { id: 'h-t-4', text: 'Does the vendor implement encryption for ePHI at rest and in transit?' },
        { id: 'h-t-5', text: 'Does the vendor use multi-factor authentication for accessing ePHI systems?' },
      ],
    },
  ],
  soc2: [
    {
      id: 'security',
      title: 'Security (Common Criteria)',
      description: 'Protection of information and systems against unauthorized access.',
      questions: [
        { id: 's-s-1', text: 'Are logical access controls implemented to restrict access to authorized users?' },
        { id: 's-s-2', text: 'Are vulnerability management and patching processes in place?' },
        { id: 's-s-3', text: 'Are intrusion detection and prevention systems deployed?' },
        { id: 's-s-4', text: 'Is network segmentation implemented to isolate sensitive data?' },
        { id: 's-s-5', text: 'Are security events monitored and responded to in a timely manner?' },
      ],
    },
    {
      id: 'availability',
      title: 'Availability',
      description: 'Systems are available for operation and use as committed or agreed.',
      questions: [
        { id: 's-a-1', text: 'Are SLAs defined and monitored for system availability?' },
        { id: 's-a-2', text: 'Are business continuity and disaster recovery plans maintained and tested?' },
        { id: 's-a-3', text: 'Is system capacity monitored and managed proactively?' },
      ],
    },
    {
      id: 'confidentiality',
      title: 'Confidentiality',
      description: 'Information designated as confidential is protected as committed or agreed.',
      questions: [
        { id: 's-c-1', text: 'Is confidential information identified, classified, and protected?' },
        { id: 's-c-2', text: 'Are data retention and disposal policies implemented?' },
        { id: 's-c-3', text: 'Are confidentiality agreements required for employees and contractors?' },
      ],
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Personal information is collected, used, retained, disclosed, and disposed of properly.',
      questions: [
        { id: 's-p-1', text: 'Is a privacy notice provided to data subjects and kept current?' },
        { id: 's-p-2', text: 'Are consent mechanisms in place for collecting personal information?' },
        { id: 's-p-3', text: 'Are data subject access and deletion requests handled per policy?' },
      ],
    },
  ],
  hitrust: [
    {
      id: 'access-control',
      title: 'Access Control',
      description: 'Restrict access to information assets and processing facilities.',
      questions: [
        { id: 'ht-ac-1', text: 'Is role-based access control implemented across all systems?' },
        { id: 'ht-ac-2', text: 'Are user access rights reviewed periodically and revoked when no longer needed?' },
        { id: 'ht-ac-3', text: 'Are privileged access rights strictly controlled and monitored?' },
        { id: 'ht-ac-4', text: 'Is multi-factor authentication enforced for remote and privileged access?' },
      ],
    },
    {
      id: 'risk-management',
      title: 'Risk Management',
      description: 'Identify, assess, and manage information security risks.',
      questions: [
        { id: 'ht-rm-1', text: 'Is a formal risk management program established and maintained?' },
        { id: 'ht-rm-2', text: 'Are risk assessments performed at least annually?' },
        { id: 'ht-rm-3', text: 'Are identified risks tracked with remediation plans and owners?' },
      ],
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Privacy',
      description: 'Protect sensitive data throughout its lifecycle.',
      questions: [
        { id: 'ht-dp-1', text: 'Is data classified according to sensitivity and criticality?' },
        { id: 'ht-dp-2', text: 'Are encryption standards applied to data at rest and in transit?' },
        { id: 'ht-dp-3', text: 'Are data loss prevention controls implemented?' },
        { id: 'ht-dp-4', text: 'Are secure data disposal procedures documented and followed?' },
      ],
    },
    {
      id: 'incident-management',
      title: 'Incident Management',
      description: 'Detect, respond to, and recover from security incidents.',
      questions: [
        { id: 'ht-im-1', text: 'Is an incident response plan documented, tested, and updated regularly?' },
        { id: 'ht-im-2', text: 'Are incidents classified by severity with defined escalation procedures?' },
        { id: 'ht-im-3', text: 'Are lessons learned from incidents used to improve security controls?' },
      ],
    },
  ],
}

const STEPS = [
  { id: 1, label: 'Setup' },
  { id: 2, label: 'Questionnaire' },
  { id: 3, label: 'Review' },
]

export default function NewAssessmentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 state
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [title, setTitle] = useState('')
  const [framework, setFramework] = useState('')
  const [loadingVendors, setLoadingVendors] = useState(false)

  // Step 2 state
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({})

  // Fetch vendors for search
  useEffect(() => {
    async function search() {
      setLoadingVendors(true)
      try {
        const params = new URLSearchParams()
        if (vendorSearch) params.set('search', vendorSearch)
        params.set('status', 'active')
        params.set('per_page', '10')
        const res = await fetch(`/api/vendors?${params.toString()}`)
        const body = await res.json()
        if (res.ok) setVendors(body.data ?? [])
      } catch {
        // silently fail
      } finally {
        setLoadingVendors(false)
      }
    }
    const timer = setTimeout(search, 300)
    return () => clearTimeout(timer)
  }, [vendorSearch])

  const sections = framework ? FRAMEWORK_TEMPLATES[framework] ?? [] : []

  const canProceedStep1 = selectedVendor && title.trim() && framework
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0)
  const answeredQuestions = Object.values(responses).filter(
    (r) => r.score !== null
  ).length

  const handleSubmit = async () => {
    if (!selectedVendor || !title || !framework) return
    setSubmitting(true)
    try {
      const assessmentResponses = Object.values(responses).map((r) => ({
        question_id: r.question_id,
        question_text: r.question_text,
        score: r.score,
        notes: r.notes,
        evidence_urls: r.evidence_urls,
      }))

      const avgScore =
        answeredQuestions > 0
          ? Math.round(
              Object.values(responses).reduce(
                (sum, r) => sum + (r.score ?? 0),
                0
              ) / answeredQuestions
            )
          : null

      // Map 1-5 score to 0-100 risk score (lower assessment score = higher risk)
      const riskScore = avgScore !== null ? Math.round((1 - (avgScore - 1) / 4) * 100) : null

      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: selectedVendor.id,
          title,
          framework,
          status: 'in_progress',
          risk_score: riskScore,
          risk_level:
            riskScore !== null
              ? riskScore >= 80
                ? 'critical'
                : riskScore >= 60
                  ? 'high'
                  : riskScore >= 40
                    ? 'medium'
                    : riskScore >= 20
                      ? 'low'
                      : 'minimal'
              : null,
          started_at: new Date().toISOString(),
          findings: {
            responses: assessmentResponses,
            total_questions: totalQuestions,
            answered_questions: answeredQuestions,
          },
        }),
      })

      if (res.ok) {
        const body = await res.json()
        const id = body.data?.id ?? body.id
        router.push(id ? `/assessments/${id}` : '/assessments')
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/assessments')}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Assessments
        </button>
        <h1 className="text-2xl font-bold tracking-tight">New Risk Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Create a new vendor risk assessment using a compliance framework.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.id < step) setStep(s.id)
              }}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                step === s.id
                  ? 'bg-primary text-primary-foreground'
                  : step > s.id
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step > s.id ? (
                <Check className="size-3.5" />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-black/10 text-xs">
                  {s.id}
                </span>
              )}
              {s.label}
            </button>
            {idx < STEPS.length - 1 && (
              <div className="hidden h-px w-8 bg-border sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Setup */}
      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          {/* Vendor Selection */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Select Vendor</h3>
            {selectedVendor ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedVendor.name}</p>
                    {selectedVendor.category && (
                      <p className="text-xs text-muted-foreground">
                        {selectedVendor.category}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVendor(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  {loadingVendors ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : vendors.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No vendors found
                    </div>
                  ) : (
                    vendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVendor(v)}
                        className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left text-sm hover:bg-muted last:border-0"
                      >
                        <Building2 className="size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{v.name}</p>
                          {v.category && (
                            <p className="text-xs text-muted-foreground">{v.category}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assessment Title */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Assessment Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Annual HIPAA Assessment 2026"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Framework <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => setFramework(fw.id)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all',
                        framework === fw.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      )}
                    >
                      <p className="font-semibold">{fw.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {fw.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Questionnaire */}
      {step === 2 && sections.length > 0 && (
        <div className="space-y-4">
          <AssessmentQuestionnaire
            sections={sections}
            responses={responses}
            onChange={setResponses}
            onSaveDraft={() => {
              // In production, save draft to backend
            }}
          />
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-1.5 size-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Review & Submit
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Review Assessment</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <p className="text-sm font-medium">{selectedVendor?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-sm font-medium">{title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Framework</p>
                  <p className="text-sm font-medium">
                    {FRAMEWORKS.find((f) => f.id === framework)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-sm font-medium">
                    {answeredQuestions}/{totalQuestions} questions answered
                  </p>
                </div>
              </div>

              {/* Section summaries */}
              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-medium">Section Summary</h4>
                <div className="space-y-2">
                  {sections.map((section) => {
                    const answered = section.questions.filter(
                      (q) => responses[q.id]?.score != null
                    ).length
                    const avgScore =
                      answered > 0
                        ? (
                            section.questions.reduce(
                              (sum, q) => sum + (responses[q.id]?.score ?? 0),
                              0
                            ) / answered
                          ).toFixed(1)
                        : '--'

                    return (
                      <div
                        key={section.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                      >
                        <span className="text-sm">{section.title}</span>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground">
                            {answered}/{section.questions.length} answered
                          </span>
                          <span className="font-medium">Avg: {avgScore}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-1.5 size-4" />
              Back to Questions
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              <ClipboardCheck className="mr-1.5 size-4" />
              Submit Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
