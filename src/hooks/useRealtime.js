import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function useRealtime(table, filter, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${filter || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter])
}
