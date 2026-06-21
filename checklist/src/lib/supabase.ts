import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Public client keys, injected at build time from .env (EXPO_PUBLIC_*).
// Safe to ship in the app; the database is protected by row-level policies.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// When keys are absent the app runs purely local (single-device). When present,
// the store mirrors everything to Supabase so all phones share the same lists.
export const isConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 10 } },
});
