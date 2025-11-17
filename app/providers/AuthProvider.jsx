"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../apiClient";
import {
  clearStoredAuth,
  loadStoredAuth,
  storeAuthSession,
} from "../lib/authStorage";

export const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
});

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored?.token && stored?.user && stored.user.role === "admin") {
      setUser(stored.user);
      setToken(stored.token);
    } else if (stored) {
      clearStoredAuth();
    }
    setLoading(false);
  }, []);

  const persistSession = useCallback((session) => {
    if (session?.token && session?.user) {
      setUser(session.user);
      setToken(session.token);
      storeAuthSession(session);
    } else {
      setUser(null);
      setToken(null);
      clearStoredAuth();
    }
  }, []);

  const login = useCallback(
    async (phone, password) => {
      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      });

      if (!payload?.token || !payload?.user) {
        throw new Error("Unexpected response from login.");
      }

      if (payload.user.role !== "admin") {
        throw new Error("Only admin accounts can access this dashboard.");
      }

      persistSession(payload);
      return payload.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
