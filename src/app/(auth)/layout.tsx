import Link from 'next/link'
import { BarChart3, LockKeyhole, Sparkles } from 'lucide-react'
import { BrandLogo } from '@/components/shared/brand-logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden border-r border-border lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,oklch(0.84_0.05_185)_0%,transparent_55%),radial-gradient(circle_at_85%_80%,oklch(0.91_0.04_120)_0%,transparent_52%),linear-gradient(160deg,oklch(0.28_0.03_230),oklch(0.2_0.02_220))]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.18))]" />
          <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white xl:p-14">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <BrandLogo textClassName="text-4xl font-semibold text-white" />
            </Link>

            <div className="space-y-7">
              <p className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">
                Vendor risk governance built for modern healthcare teams.
              </p>
              <p className="max-w-xl text-base text-white/80">
                Centralize assessments, monitor incidents, and keep HIPAA
                compliance visible across every third-party relationship.
              </p>
              <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <BarChart3 className="mb-2 size-5 text-emerald-200" />
                  <p className="text-sm font-semibold">Risk Analytics</p>
                  <p className="text-xs text-white/70">Live posture tracking</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <LockKeyhole className="mb-2 size-5 text-cyan-200" />
                  <p className="text-sm font-semibold">HIPAA Ready</p>
                  <p className="text-xs text-white/70">Compliance workflows</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <Sparkles className="mb-2 size-5 text-amber-200" />
                  <p className="text-sm font-semibold">Audit Trail</p>
                  <p className="text-xs text-white/70">Evidence in one place</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/65">
              Trusted by hospital security, compliance, and vendor governance
              teams.
            </p>
          </div>
        </aside>

        <main className="relative flex min-h-screen items-center justify-center p-6 sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,oklch(0.9_0.03_175)_0%,transparent_30%),radial-gradient(circle_at_10%_80%,oklch(0.92_0.02_230)_0%,transparent_30%)]" />
          <div className="relative z-10 w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <BrandLogo textClassName="text-lg font-semibold text-foreground" />
            </Link>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
