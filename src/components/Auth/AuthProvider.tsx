import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { normalizeRole, type Role } from '../../constants/rbac';

export type CurrentUser = {
  id: string;
  phone?: string;
  account?: string;
  full_name?: string;
  role: Role;
};

type AuthContextValue = {
  user: CurrentUser | null;
  setUser: (next: CurrentUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const readUserFromStorage = (): CurrentUser | null => {
  const sessionStr = localStorage.getItem('xiaoyu_user');
  if (!sessionStr) return null;
  try {
    const raw = JSON.parse(sessionStr) as Record<string, unknown>;
    const id = typeof raw.id === 'string' ? raw.id : null;
    const role = normalizeRole(raw.role);
    if (!id || !role) return null;
    return {
      id,
      role,
      phone: typeof raw.phone === 'string' ? raw.phone : undefined,
      account: typeof raw.account === 'string' ? raw.account : undefined,
      full_name: typeof raw.full_name === 'string' ? raw.full_name : undefined,
    };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<CurrentUser | null>(() => readUserFromStorage());

  const setUser = useCallback((next: CurrentUser | null) => {
    setUserState(next);
    if (!next) {
      localStorage.removeItem('xiaoyu_user');
      return;
    }
    localStorage.setItem(
      'xiaoyu_user',
      JSON.stringify({
        id: next.id,
        phone: next.phone,
        account: next.account,
        role: next.role,
        full_name: next.full_name,
      }),
    );
  }, []);

  const logout = useCallback(() => setUser(null), [setUser]);

  const value = useMemo<AuthContextValue>(() => ({ user, setUser, logout }), [logout, setUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};

