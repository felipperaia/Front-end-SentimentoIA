import { authApi, AuthUser, clearAuthSession, getStoredUser, setAuthSession } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      const token = localStorage.getItem("sentimentoia_access_token");
      if (token) setAuthSession(token, currentUser);
      return currentUser;
    } catch (err) {
      clearAuthSession();
      setUser(null);
      setError(err instanceof Error ? err : new Error("Authentication error"));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sentimentoia_access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      globalThis.location.href = "/";
    }
  }, []);

  const state = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error]
  );

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (globalThis.window === undefined) return;
    if (globalThis.location.pathname === redirectPath) return;
    globalThis.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return {
    ...state,
    refresh,
    logout,
  };
}
