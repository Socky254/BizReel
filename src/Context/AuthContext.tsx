import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

// DIRECT ZUSTAND WRAPPER FOR BACKWARD COMPATIBILITY
// This doesn't require a Provider wrap at the root, making it more robust.
export const useAuth = () => {
  const session = useAuthStore((state) => state.session);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);

  return { session, user, loading };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};


