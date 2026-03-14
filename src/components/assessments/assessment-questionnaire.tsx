'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle2,
  Upload,
  MessageSquare,
} from 'lucide-react'

export interface Question {
  id: string
  text: string
  category?: string
  helpText?: string
}

export interface Section {
  id: string
  title: string
  description?: string
  questions: Question[]
}

export interface QuestionResponse {
  question_id: string
  question_text: string
  score: number | null
  notes: string
  evidence_urls: string[]
}

interface AssessmentQuestionnaireProps {
  sections: Section[]
  responses: Record<string, QuestionResponse>
  onChange: (responses: Record<string, QuestionResponse>) => void
  onSaveDraft?: () => void
  saving?: boolean
  readOnly?: boolean
}

export function AssessmentQuestionnaire({
  sections,
  responses,
  onChange,
  onSaveDraft,
  saving = false,
  readOnly = false,
}: AssessmentQuestionnaireProps) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)

  const activeSection = sections[activeSectionIndex]

  const updateResponse = useCallback(
    (questionId: string, questionText: string, field: 'score' | 'notes', value: any) => {
      const existing = responses[questionId] ?? {
        question_id: questionId,
        question_text: questionText,
        score: null,
        notes: '',
        evidence_urls: [],
      }
      const updated = { ...responses, [questionId]: { ...existing, [field]: value } }
      onChange(updated)
    },
    [responses, onChange]
  )

  const getSectionProgress = (section: Section) => {
    const answered = section.questions.filter(
      (q) => responses[q.id]?.score !== null && responses[q.id]?.score !== undefined
    ).length
    return { answered, total: section.questions.length }
  }

  const totalProgress = sections.reduce(
    (acc, s) => {
      const p = getSectionProgress(s)
      return { answered: acc.answered + p.answered, total: acc.total + p.total }
    },
    { answered: 0, total: 0 }
  )

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Section Navigation */}
      <div className="w-full shrink-0 lg:w-64">
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">
                {totalProgress.answered}/{totalProgress.total}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${totalProgress.total > 0 ? (totalProgress.answered / totalProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <nav className="space-y-1">
            {sections.map((section, idx) => {
              const progress = getSectionProgress(section)
              const isComplete = progress.answered === progress.total && progress.total > 0
              const isActive = idx === activeSectionIndex

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionIndex(idx)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                      isComplete
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="flex-1 truncate">{section.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {progress.answered}/{progress.total}
                  </span>
                </button>
              )
            })}
          </nav>

          {onSaveDraft && !readOnly && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={onSaveDraft}
              disabled={saving}
            >
              <Save className="mr-1.5 size-3.5" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
          )}
        </div>
      </div>

      {/* Questions Panel */}
      <div className="flex-1">
        {activeSection && (
          <div className="rounded-xl border bg-card">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold">{activeSection.title}</h3>
              {activeSection.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeSection.description}
                </p>
              )}
            </div>

            <div className="divide-y">
              {activeSection.questions.map((question, qIdx) => {
                const response = responses[question.id]
                const currentScore = response?.score ?? null
                const currentNotes = response?.notes ?? ''

                return (
                  <div key={question.id} className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {qIdx + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium leading-relaxed">
                          {question.text}
                        </p>
                        {question.helpText && (
                          <p className="text-xs text-muted-foreground">
                            {question.helpText}
                          </p>
                        )}

                        {/* Score selector */}
                        <div>
                          <label className="mb-2 block text-xs font-medium text-muted-foreground">
                            Score (1-5)
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <button
                                key={score}
                                type="button"
                                disabled={readOnly}
                                onClick={() =>
                                  updateResponse(
                                    question.id,
                                    question.text,
                                    'score',
                                    score
                                  )
                                }
                                className={cn(
                                  'flex size-9 items-center justify-center rounded-lg border text-sm font-medium transition-all',
                                  currentScore === score
                                    ? score <= 2
                                      ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : score === 3
                                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'border-border hover:border-primary/50 hover:bg-muted',
                                  readOnly && 'cursor-default'
                                )}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <MessageSquare className="size-3" />
                            Notes
                          </label>
                          <textarea
                            value={currentNotes}
                            disabled={readOnly}
                            onChange={(e) =>
                              updateResponse(
                                question.id,
                                question.text,
                                'notes',
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-default disabled:opacity-60"
                            placeholder="Add notes or observations..."
                          />
                        </div>

                        {/* Evidence upload placeholder */}
                        {!readOnly && (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Upload className="size-3" />
                            Attach evidence
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Section navigation */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSectionIndex((i) => Math.max(0, i - 1))}
                disabled={activeSectionIndex === 0}
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Section {activeSectionIndex + 1} of {sections.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveSectionIndex((i) => Math.min(sections.length - 1, i + 1))
                }
                disabled={activeSectionIndex === sections.length - 1}
              >
                Next
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
