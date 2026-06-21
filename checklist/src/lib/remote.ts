import { supabase } from './supabase';
import type { Item, List } from './types';

/**
 * Thin Supabase data layer used by the store when cloud sync is configured.
 * Mutations are fire-and-forget (last-write-wins); a realtime subscription
 * tells every device to refetch, keeping all phones in sync.
 */

export async function fetchAll(): Promise<{ lists: List[]; items: Item[] }> {
  const [l, i] = await Promise.all([
    supabase.from('lists').select('*'),
    supabase.from('items').select('*'),
  ]);
  if (l.error) throw l.error;
  if (i.error) throw i.error;
  return { lists: (l.data ?? []) as List[], items: (i.data ?? []) as Item[] };
}

export const insertList = (list: List) => supabase.from('lists').insert(list);
export const updateList = (id: string, patch: Partial<List>) =>
  supabase.from('lists').update(patch).eq('id', id);
export const deleteList = (id: string) => supabase.from('lists').delete().eq('id', id);
export const upsertLists = (lists: List[]) => supabase.from('lists').upsert(lists);

export const insertItem = (item: Item) => supabase.from('items').insert(item);
export const updateItem = (id: string, patch: Partial<Item>) =>
  supabase.from('items').update(patch).eq('id', id);
export const deleteItem = (id: string) => supabase.from('items').delete().eq('id', id);
export const upsertItems = (items: Item[]) => supabase.from('items').upsert(items);
export const resetListItems = (listId: string) =>
  supabase.from('items').update({ is_done: false }).eq('list_id', listId);

/** Subscribe to all list/item changes; returns an unsubscribe function. */
export function subscribe(onChange: () => void) {
  const channel = supabase
    .channel('rashimot-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
