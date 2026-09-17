import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "../lib/supabase";

const AuthContext = createContext(null);
const GUEST_STORAGE_KEY = "sv-auth:guest-session";

const GUEST_USER = {
  id: "guest",
  email: "",
  name: "Guest",
  isGuest: true,
  cloudSync: false,
};

function readGuest() {
  try {
    return localStorage.getItem(GUEST_STORAGE_KEY) === "1" ? GUEST_USER : null;
  } catch {
    return null;
  }
}

function writeGuest(enabled) {
  try {
    if (enabled) localStorage.setItem(GUEST_STORAGE_KEY, "1");
    else localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // Private browsing can block storage; guest mode still works for the tab.
  }
}

function authMessage(error, fallback) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (message.includes("email not confirmed")) return "Confirm your email before signing in.";
  if (message.includes("user already registered")) return "An account already exists for this email.";
  if (message.includes("password should be")) return "Use a password with at least 8 characters.";
  if (message.includes("rate limit")) return "Too many attempts. Wait a moment and try again.";
  if (message.includes("failed to fetch") || message.includes("network")) return "We could not reach the account service. Check your connection and try again.";
  return error?.message || fallback;
}

function userFrom(authUser, profile = null) {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile?.display_name || authUser.user_metadata?.full_name || "",
    isGuest: false,
    cloudSync: Boolean(profile?.cloud_sync),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => supabaseConfigured ? null : readGuest());
  const [loading, setLoading] = useState(supabaseConfigured);
  const [recovery, setRecovery] = useState(false);
  const [profileError, setProfileError] = useState("");

  const hydrate = useCallback(async (authUser) => {
    const supabase = getSupabase();
    if (!supabase || !authUser) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, cloud_sync")
      .eq("id", authUser.id)
      .maybeSingle();
    if (error) {
      setProfileError("Your account is signed in, but cloud data is unavailable until the Supabase migration is applied.");
      return userFrom(authUser);
    }
    if (!data) {
      const fallback = {
        id: authUser.id,
        display_name: authUser.user_metadata?.full_name || "",
        cloud_sync: false,
      };
      const { error: createError } = await supabase.from("profiles").upsert(fallback, { onConflict: "id" });
      if (createError) {
        setProfileError("Your account is signed in, but its profile could not be created.");
        return userFrom(authUser);
      }
      setProfileError("");
      return userFrom(authUser, fallback);
    }
    setProfileError("");
    return userFrom(authUser, data);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      return undefined;
    }

    const supabase = getSupabase();
    let active = true;
    const applySession = async (session) => {
      if (!session?.user) {
        if (active) setUser(readGuest());
        return;
      }
      writeGuest(false);
      const next = await hydrate(session.user);
      if (active && next) setUser(next);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setTimeout(() => void applySession(session), 0);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        return applySession(data.session);
      })
      .catch(() => {
        if (active) setUser(readGuest());
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrate]);

  const login = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Account sign-in is not configured yet.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(authMessage(error, "Sign-in failed."));
    writeGuest(false);
    const next = await hydrate(data.user);
    setUser(next);
    return next;
  }, [hydrate]);

  const register = useCallback(async (name, email, password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Account creation is not configured yet.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(authMessage(error, "Account creation failed."));
    if (!data.session) return { requiresConfirmation: true, email };
    const next = await hydrate(data.user);
    setUser(next);
    return { user: next, requiresConfirmation: false };
  }, [hydrate]);

  const resendConfirmation = useCallback(async (email) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Account email is not configured yet.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(authMessage(error, "Could not resend the email."));
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Password recovery is not configured yet.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/?recovery=1`,
    });
    if (error) throw new Error(authMessage(error, "Could not send the reset email."));
  }, []);

  const updatePassword = useCallback(async (password) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Password recovery is not configured yet.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(authMessage(error, "Could not update the password."));
    setRecovery(false);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const loginAsGuest = useCallback(() => {
    writeGuest(true);
    setUser(GUEST_USER);
    return GUEST_USER;
  }, []);

  const logout = useCallback(async () => {
    writeGuest(false);
    if (!user?.isGuest) await getSupabase()?.auth.signOut().catch(() => {});
    setUser(null);
  }, [user]);

  const updateProfile = useCallback(async ({ name }) => {
    if (!user || user.isGuest) return user;
    const displayName = String(name ?? user.name).trim();
    const { error } = await getSupabase()
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    const next = { ...user, name: displayName };
    setUser(next);
    return next;
  }, [user]);

  const setCloudSync = useCallback(async (enabled) => {
    if (!user || user.isGuest) return false;
    const { error } = await getSupabase()
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: user.name || "",
        cloud_sync: Boolean(enabled),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    setUser((current) => ({ ...current, cloudSync: Boolean(enabled) }));
    return Boolean(enabled);
  }, [user]);

  const clearCloudData = useCallback(async () => {
    if (!user || user.isGuest) return;
    const { error } = await getSupabase().rpc("clear_user_data");
    if (error) throw new Error(error.message);
    setUser((current) => ({ ...current, cloudSync: false }));
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!user || user.isGuest) return;
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Your session expired. Sign in again before deleting the account.");
    const response = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Could not delete the account.");
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  }, [user]);

  const value = useMemo(() => ({
    configured: supabaseConfigured,
    user,
    loading,
    recovery,
    profileError,
    login,
    register,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    loginAsGuest,
    logout,
    updateProfile,
    setCloudSync,
    clearCloudData,
    deleteAccount,
  }), [user, loading, recovery, profileError, login, register, resendConfirmation, requestPasswordReset, updatePassword, loginAsGuest, logout, updateProfile, setCloudSync, clearCloudData, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
