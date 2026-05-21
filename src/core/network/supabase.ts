import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Robust environment variable fetching with cleanup
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("CRITICAL: Supabase environment variables are missing! Check your .env and eas.json.");
}

// Provide fallback values to prevent createClient from throwing on empty strings
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile doesn't use URL-based sessions the same way as web
  },
});

// Diagnostic helper to verify connectivity
export const checkSupabaseConnection = async () => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(0);
    const duration = Date.now() - start;

    if (error) {
      console.error('[Supabase Diagnostic] Connection failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Supabase Diagnostic] Connected successfully in ${duration}ms`);
    return { success: true, duration };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Supabase Diagnostic] Critical error:', msg);
    return { success: false, error: msg };
  }
};
