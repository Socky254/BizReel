import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

// We keep this file for backward compatibility, but it now uses Zustand under the hood.
export const useAuth = () => {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  return { session, user, loading };
};

// Dummy provider that doesn't do anything because state is managed by Zustand in Providers.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
