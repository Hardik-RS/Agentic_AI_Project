import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { getCurrentUser, getProfile, isLoggedIn, logout as authLogout } from '@/api/auth';
import { getStoredUser } from '@/utils/auth';

interface AuthContextValue {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = getStoredUser();
    const loggedIn = isLoggedIn();
    setUser(stored);
    setAuthenticated(loggedIn);

    if (!loggedIn) return;

    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Unable to load the authenticated user profile.', error);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const logout = () => {
    authLogout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, authenticated, loading, setUser, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Convenience export for initial check
export { getCurrentUser };
