import { supabase } from '../network/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppConfig = {
  features: { live_stream: boolean; marketplace: boolean; ai_mentor: boolean; };
  limits: { upload_max_mb: number; };
  rules: { feed_ranking: 'latest' | 'trending'; }
};

const CACHE_KEY = 'BIZREEL_STABLE_CONFIG';

export class ConfigEngine {
  static async getActiveConfig(): Promise<AppConfig> {
    const fallback = this.getFallback();

    try {
      // 3-second timeout for the network fetch
      const fetchPromise = supabase.from('system_config').select('value').eq('key', 'app_parameters').single();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));

      const { data }: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (data?.value) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.value));
        return data.value;
      }
      throw new Error('Invalid Data');
    } catch (e) {
      console.log("Config: Using local/cached rules.");
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : fallback;
    }
  }

  private static getFallback(): AppConfig {
    return {
      features: { live_stream: true, marketplace: true, ai_mentor: true },
      limits: { upload_max_mb: 50 },
      rules: { feed_ranking: 'latest' }
    };
  }
}
