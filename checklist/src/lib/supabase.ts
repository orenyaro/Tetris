import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced loudly in dev so a missing .env is obvious rather than a silent
  // "nothing syncs" failure.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your project keys.',
  );
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    // No accounts: we don't persist or refresh any session.
    persistSession: false,
    autoRefreshToken: false,
    // Provide storage only so the SDK is happy on native; unused without auth.
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
  },
});

export const isConfigured = Boolean(url && anonKey);
