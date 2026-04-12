'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useTyping(sessionId: string | null, alias: string | null) {
  const supabase = createClient();
  const timer = useRef<NodeJS.Timeout>();

  const onTyping = useCallback(() => {
    if (!sessionId || !alias) return;

    supabase.from('typing_indicators').upsert(
      { session_id: sessionId, alias, updated_at: new Date().toISOString() },
      { onConflict: 'session_id,alias' }
    );

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      supabase.from('typing_indicators')
        .delete()
        .eq('session_id', sessionId)
        .eq('alias', alias);
    }, 2500);
  }, [sessionId, alias, supabase]);

  const clearTyping = useCallback(() => {
    clearTimeout(timer.current);
    if (!sessionId || !alias) return;
    supabase.from('typing_indicators')
      .delete()
      .eq('session_id', sessionId)
      .eq('alias', alias);
  }, [sessionId, alias, supabase]);

  return { onTyping, clearTyping };
}
