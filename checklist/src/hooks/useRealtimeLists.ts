import { useCallback, useEffect, useState } from 'react';
import { fetchLists } from '../lib/db';
import { DEMO, demoLists } from '../lib/demo';
import { applyChange, byCreatedAt } from '../lib/reconcile';
import { supabase } from '../lib/supabase';
import type { ChangeEvent, List } from '../lib/types';

/**
 * Live view of every list in the shared space. An initial fetch seeds the
 * state; a postgres_changes subscription then streams create/delete from any
 * device straight into the list.
 */
export function useRealtimeLists() {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLists(await fetchLists());
    } catch (e: any) {
      setError(e?.message ?? 'Could not load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (DEMO) {
      setLists(demoLists);
      setLoading(false);
      return;
    }
    load();

    const channel = supabase
      .channel('lists-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        (payload) => {
          setLists((cur) => applyChange(cur, payload as ChangeEvent<List>, byCreatedAt));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { lists, loading, error, reload: load };
}
