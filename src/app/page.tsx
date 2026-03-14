import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  BellRing,
  Building2,
  FileCheck2,
  Siren,
  Sparkles,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/brand-logo'
import { createClient } from '@/lib/supabase/server'

const modules = [
  {
    title: 'Vendor Intelligence',
    description:
      'Track critical vendors, tier by impact, and maintain full due-diligence context.',
    icon: Building2,
  },
  {
    title: 'Risk Assessments',
    description:
      'Run structured assessments with scoring, findings, and remediation timelines.',
    icon: FileCheck2,
  },
  {
    title: 'Incident Readiness',
    description:
      'Capture incidents fast, assign owners, and preserve audit-grade response history.',
    icon: Siren,
  },
  {
    title: 'Real-Time Alerts',
    description:
      'Notify stakeholders on contract expiry, compliance drift, and risk score changes.',
    icon: BellRing,
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,oklch(0.9_0.04_175)_0%,transparent_32%),radial-gradient(circle_at_85%_80%,oklch(0.92_0.03_220)_0%,transparent_30%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <BrandLogo textClassName="text-4xl font-semibold text-foreground" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start Free
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Healthcare Third-Party Risk Platform
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Control vendor risk before it becomes clinical risk.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              HealthShield gives healthcare organizations a single command center
              for vendor security, HIPAA posture, contract obligations, and
              incident response.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Create Organization
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border/90 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8">
            <p className="mb-4 text-3xl font-semibold tracking-tight">
              Why teams switch
            </p>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Visibility</p>
                <p className="mt-1 text-sm">Unify vendor, contract, assessment, and alert data in one operational view.</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Speed</p>
                <p className="mt-1 text-sm">Cut onboarding and reassessment cycles with reusable controls and templates.</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assurance</p>
                <p className="mt-1 text-sm">Generate audit-ready evidence for HIPAA and internal governance reviews.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-4xl font-semibold tracking-tight">Core Platform Modules</h2>
          <p className="mt-2 text-muted-foreground">
            Built to map directly to healthcare risk and compliance workflows.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-border bg-card p-5">
                <module.icon className="mb-3 size-5 text-primary" />
                <h3 className="text-2xl font-semibold tracking-tight">{module.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
