'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { GlobalLoaderProvider } from '@/components/shared/global-loader-provider'
// Install sonner for toast notifications: npm install sonner
// import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoaderProvider>{children}</GlobalLoaderProvider>
      {/* <Toaster position="top-right" richColors /> */}
    </QueryClientProvider>
  )
}
