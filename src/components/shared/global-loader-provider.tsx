'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

interface GlobalLoaderContextValue {
  showLoader: () => void
  hideLoader: () => void
  withLoader: <T>(action: () => Promise<T>) => Promise<T>
}

const GlobalLoaderContext = createContext<GlobalLoaderContextValue | null>(null)

const SHOW_DELAY_MS = 120

function GlobalLoader({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[120]">
      <div className="h-0.5 w-full bg-primary/25">
        <div className="h-full w-full animate-pulse bg-primary" />
      </div>
      <div className="absolute right-4 top-3 flex items-center gap-2 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border">
        <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading</span>
      </div>
    </div>
  )
}

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDelayTimer = useCallback(() => {
    if (!delayTimerRef.current) return
    clearTimeout(delayTimerRef.current)
    delayTimerRef.current = null
  }, [])

  useEffect(() => {
    if (activeCount > 0) {
      if (!delayTimerRef.current) {
        delayTimerRef.current = setTimeout(() => {
          setVisible(true)
        }, SHOW_DELAY_MS)
      }
      return
    }

    clearDelayTimer()
    setVisible(false)
  }, [activeCount, clearDelayTimer])

  useEffect(() => clearDelayTimer, [clearDelayTimer])

  const showLoader = useCallback(() => {
    setActiveCount((count) => count + 1)
  }, [])

  const hideLoader = useCallback(() => {
    setActiveCount((count) => (count > 0 ? count - 1 : 0))
  }, [])

  const withLoader = useCallback(
    async <T,>(action: () => Promise<T>) => {
      showLoader()
      try {
        return await action()
      } finally {
        hideLoader()
      }
    },
    [hideLoader, showLoader]
  )

  const value = useMemo<GlobalLoaderContextValue>(
    () => ({ showLoader, hideLoader, withLoader }),
    [hideLoader, showLoader, withLoader]
  )

  return (
    <GlobalLoaderContext.Provider value={value}>
      <GlobalLoader visible={visible} />
      {children}
    </GlobalLoaderContext.Provider>
  )
}

export function useGlobalLoader() {
  const context = useContext(GlobalLoaderContext)
  if (!context) {
    throw new Error('useGlobalLoader must be used within GlobalLoaderProvider')
  }
  return context
}
