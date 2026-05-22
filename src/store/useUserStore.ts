import { create } from 'zustand';
import { Profile } from '../domain/models';

interface UserState {
  profile: Profile | null;
  isPremium: boolean;
  setProfile: (profile: Profile | null) => void;
  setPremium: (isPremium: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isPremium: false,
  setProfile: (profile) =>
    set({
      profile,
      isPremium: profile?.tier === 'PRO' || profile?.tier === 'ENTERPRISE',
    }),
  setPremium: (isPremium) => set({ isPremium }),
}));
