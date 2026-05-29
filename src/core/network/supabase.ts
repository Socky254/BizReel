import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../utils/Logger';

// Robust environment variable fetching with cleanup
const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  Logger.error('CRITICAL: Supabase environment variables are missing!');
}

// Provide fallback values to prevent createClient from throwing on empty strings
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options) => {
      let retries = 3;
      while (retries > 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for large uploads

        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timeoutId);

          if (response.status >= 500 && retries > 1) {
            console.log(`Supabase Fetch: Server error ${response.status}. Retrying...`);
            retries--;
            await new Promise((res) => setTimeout(res, 1000));
            continue;
          }
          return response;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (retries > 1 && (err.name === 'AbortError' || err.message.includes('upstream'))) {
            retries--;
            await new Promise((res) => setTimeout(res, 1000));
            continue;
          }
          throw err;
        }
      }
      return fetch(url, options);
    },
  },
});

// Diagnostic helper to verify connectivity
export const checkSupabaseConnection = async () => {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(0);
    const duration = Date.now() - start;

    if (error) {
      Logger.error('Supabase Connection failed', error.message);
      return { success: false, error: error.message };
    }

    Logger.perf('Supabase Diagnostic', duration);
    return { success: true, duration };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    Logger.error('Supabase Critical error', msg);
    return { success: false, error: msg };
  }
};
