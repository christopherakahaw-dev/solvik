/**
 * AuthContext.jsx — React context for FlowGuard authentication.
 *
 * Provides:
 *   user          — current user object, or null if signed out
 *   loading       — true while the initial session check is in flight
 *   login()       — sign in with email + password
 *   register()    — create a new account
 *   logout()      — clear the session
 *   updateProfile() — persist preferences or name back to the server
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

async function apiFetch(action, body) {
  const opts = {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`/api/auth?action=${action}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first mount, check if the browser already has a valid session cookie.
  useEffect(() => {
    apiFetch("me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await apiFetch("login", { email, password });
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const d = await apiFetch("register", { name, email, password });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("logout").catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const d = await apiFetch("update-profile", patch);
    setUser(d.user);
    return d.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
