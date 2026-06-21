import { supabase } from './supabase';
import type { Item, List } from './types';

// Friendly, unambiguous share codes (no 0/O/1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeShareCode(len = 6): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// ---- Lists ----------------------------------------------------------------

export async function fetchLists(): Promise<List[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createList(name: string): Promise<List> {
  const { data, error } = await supabase
    .from('lists')
    .insert({ name: name.trim(), share_code: makeShareCode() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Deletes the list for everyone; items cascade-delete in the DB.
export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id);
  if (error) throw error;
}

export async function findListByCode(code: string): Promise<List | null> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('share_code', code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchList(id: string): Promise<List | null> {
  const { data, error } = await supabase.from('lists').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Items ----------------------------------------------------------------

export async function fetchItems(listId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('list_id', listId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addItem(listId: string, text: string, position: number): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert({ list_id: listId, text: text.trim(), position, is_done: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Permanent removal — distinct from the temporary strikethrough below.
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

// The strikethrough toggle. Last write wins: we just overwrite is_done.
export async function setItemDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ is_done: done, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Reset: clear every strikethrough in a list, keeping all items intact.
export async function resetList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ is_done: false, updated_at: new Date().toISOString() })
    .eq('list_id', listId);
  if (error) throw error;
}
