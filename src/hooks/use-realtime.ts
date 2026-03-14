import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface UseRealtimeOptions {
  event?: RealtimeEvent
  filter?: string
  enabled?: boolean
}

export function useRealtime<T extends Record<string, unknown>>(
  table: string,
  orgId: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  options: UseRealtimeOptions = {}
) {
  const { event = '*', filter, enabled = true } = options
  const callbackRef = useRef(callback)

  // Keep callback ref current without triggering re-subscription
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled || !orgId) return

    const supabase = createClient()

    const channelName = `realtime:${table}:${orgId}`

    const filterString = filter
      ? filter
      : `org_id=eq.${orgId}`

    const channel = supabase
      .channel(channelName)
      .on<T>(
        'postgres_changes' as never,
        {
          event,
          schema: 'public',
          table,
          filter: filterString,
        },
        (payload: RealtimePostgresChangesPayload<T>) => {
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, orgId, event, filter, enabled])
}
