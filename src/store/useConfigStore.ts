import { create } from 'zustand';
import { AppConfig, ConfigService } from '../services/ConfigService';

interface ConfigState {
  config: AppConfig | null;
  loading: boolean;
  safeMode: boolean;
  initConfig: () => Promise<void>;
  isEnabled: (feature: keyof AppConfig) => boolean;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: true,
  safeMode: false,
  initConfig: async () => {
    try {
      set({ loading: true });
      const remoteConfig = await ConfigService.fetchRemoteConfig();
      set({ config: remoteConfig, loading: false, safeMode: false });
    } catch (e) {
      console.error("Critical Boot Error: Entering Safe Mode");
      set({ loading: false, safeMode: true });
    }
  },
  isEnabled: (feature) => {
    const config = get().config;
    if (!config) return false;
    return !!config[feature];
  }
}));
