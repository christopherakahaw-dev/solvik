/**
 * AuthContext.jsx — React context for FlowGuard authentication.
 *
 * Provides:
 *   user          — current user object, or null if signed out
 *   loading       — true while the initial session check is in flight
 *   login()       — sign in with email + password
 *   register()    — create a new account
 *   loginAsGuest() — enter the app without an account (this device only)
 *   logout()      — clear the session
 *   updateProfile() — persist preferences or name back to the server
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);
const GUEST_STORAGE_KEY = "fg_guest";

const GUEST_USER = {
  id: "guest",
  email: "",
  name: "Guest",
  isGuest: true,
  preferences: {},
};

function readStoredGuest() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.isGuest ? { ...GUEST_USER, ...parsed, isGuest: true } : null;
  } catch {
    return null;
  }
}

function writeStoredGuest(user) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredGuest() {
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

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

  // Prefer a real session cookie; otherwise restore a local guest session.
  useEffect(() => {
    apiFetch("me")
      .then((d) => {
        clearStoredGuest();
        setUser(d.user);
      })
      .catch(() => setUser(readStoredGuest()))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await apiFetch("login", { email, password });
    clearStoredGuest();
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const d = await apiFetch("register", { name, email, password });
    clearStoredGuest();
    setUser(d.user);
    return d.user;
  }, []);

  const loginAsGuest = useCallback(() => {
    writeStoredGuest(GUEST_USER);
    setUser(GUEST_USER);
    return GUEST_USER;
  }, []);

  const logout = useCallback(async () => {
    clearStoredGuest();
    await apiFetch("logout").catch(() => {});
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    if (user?.isGuest) {
      const next = {
        ...user,
        name: patch.name != null ? patch.name : user.name,
        preferences: patch.preferences != null
          ? { ...user.preferences, ...patch.preferences }
          : user.preferences,
      };
      writeStoredGuest(next);
      setUser(next);
      return next;
    }
    const d = await apiFetch("update-profile", patch);
    setUser(d.user);
    return d.user;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginAsGuest, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
