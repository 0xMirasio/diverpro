import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, loadToken, saveToken } from "./api";
import type { Locale, User } from "./types";

type Registration = { firstName: string; lastName: string; username: string; email: string; password: string; locale: Locale };
type AuthValue = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: Registration) => Promise<void>;
  logout: () => Promise<void>; refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const result = await api<{ user: User }>("/api/auth/me");
    setUser(result.user);
  }, []);
  useEffect(() => { void (async () => { try { if (await loadToken()) await refresh(); } catch { await saveToken(null); } finally { setLoading(false); } })(); }, [refresh]);
  const login = async (email: string, password: string) => {
    const result = await api<{ accessToken: string }>("/api/auth/mobile/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await saveToken(result.accessToken); await refresh();
  };
  const register = async (input: Registration) => {
    const result = await api<{ accessToken: string }>("/api/auth/mobile/register", { method: "POST", body: JSON.stringify(input) });
    await saveToken(result.accessToken); await refresh();
  };
  const logout = async () => { await saveToken(null); setUser(null); };
  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider missing"); return value;
}
