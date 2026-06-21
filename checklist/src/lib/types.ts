export type List = {
  id: string;
  name: string;
  share_code: string;
  created_at: string;
};

export type Item = {
  id: string;
  list_id: string;
  text: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

// Shape of a Supabase postgres_changes payload (the parts we use).
export type ChangeEvent<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | Record<string, never>;
  old: Partial<T> | Record<string, never>;
};
