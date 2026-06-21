export type List = {
  id: string;
  name: string;
  position: number;
  created_at: string;
};

import type { PersonId } from './people';

export type Item = {
  id: string;
  list_id: string;
  text: string;
  is_done: boolean;
  position: number;
  assignee: PersonId | null; // who's responsible (null = unassigned)
  created_at: string;
  updated_at: string;
};

// Shape of a Supabase postgres_changes payload (the parts we use).
export type ChangeEvent<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | Record<string, never>;
  old: Partial<T> | Record<string, never>;
};
