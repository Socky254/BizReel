import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppConfig = {
  live_enabled: boolean;
  market_enabled: boolean;
  max_upload_mb: number;
  feed_algorithm: 'latest' | 'trending' | 'curated';
  moderation_sensitivity: number; // 0 to 1
  maintenance_mode: boolean;
};

const DEFAULT_CONFIG: AppConfig = {
  live_enabled: true,
  market_enabled: true,
  max_upload_mb: 50,
  feed_algorithm: 'latest',
  moderation_sensitivity: 0.5,
  maintenance_mode: false,
};

const CONFIG_CACHE_KEY = 'BIZREEL_REMOTE_CONFIG';

export class ConfigService {
  /**
   * Safe Cloud Interaction: Fetches pure JSON rules.
   */
  static async fetchRemoteConfig(): Promise<AppConfig> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'app_parameters')
        .maybeSingle();

      if (error || !data) throw new Error('Cloud unreachable');

      const config = { ...DEFAULT_CONFIG, ...data.value };
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
      return config;
    } catch (e) {
      console.warn('Using offline fallback config');
      const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_CONFIG;
    }
  }
}
