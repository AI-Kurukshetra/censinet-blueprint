'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setIsSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-xl shadow-black/5 backdrop-blur sm:p-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email a secure reset link to your account.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-6 text-center dark:border-emerald-700/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <h3 className="text-2xl font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              A password reset link has been sent. Follow the email instructions
              to set a new password.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@hospital.org"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Link
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </section>
  )
}
