/**
 * AuthScreen.jsx — Full-screen login / register gate for FlowGuard.
 *
 * Shown whenever the app has no active session. Two panels toggle via a
 * top tab strip: "Sign in" and "Create account". Matches the existing
 * sand/green design tokens, Button component, and sv-rise animation.
 */

import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../design-system";

// ─── Tiny local helpers ───────────────────────────────────────────────────────

function Input({ label, type = "text", value, onChange, placeholder, autoComplete, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          font: "var(--weight-bold) var(--size-caption)/1 var(--font-body)",
          color: "var(--text-muted)",
          letterSpacing: ".04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 50,
          padding: "0 16px",
          font: "var(--weight-medium) var(--size-body)/1 var(--font-body)",
          color: "var(--text-strong)",
          background: "var(--surface-card)",
          border: `1.5px solid ${error ? "var(--status-alert)" : focused ? "var(--border-focus)" : "var(--border-hairline)"}`,
          borderRadius: "var(--radius-control)",
          outline: "none",
          transition: "border-color .15s",
          width: "100%",
        }}
      />
      {error && (
        <span
          style={{
            font: "var(--type-caption)",
            color: "var(--status-alert)",
            marginTop: 2,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: "var(--text-subtle)",
        font: "var(--type-caption)",
      }}
    >
      <span style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
      {label}
      <span style={{ flex: 1, height: 1, background: "var(--border-hairline)" }} />
    </div>
  );
}

// ─── Login panel ─────────────────────────────────────────────────────────────

function LoginPanel({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setServerError(err.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        autoComplete="current-password"
        error={errors.password}
      />

      {serverError && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-card)",
            background: "var(--rust-100)",
            border: "1px solid var(--rust-700)",
            font: "var(--type-body-sm)",
            color: "var(--rust-700)",
          }}
        >
          {serverError}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <Divider label="Don't have an account?" />

      <Button variant="secondary" size="md" fullWidth onClick={onSwitch} type="button">
        Create an account
      </Button>
    </form>
  );
}

// ─── Register panel ───────────────────────────────────────────────────────────

function RegisterPanel({ onSwitch }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Must be at least 8 characters.";
    if (password && confirm !== password) e.confirm = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setServerError("");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      setServerError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Harry Tan"
        autoComplete="name"
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password}
      />
      <Input
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repeat your password"
        autoComplete="new-password"
        error={errors.confirm}
      />

      {serverError && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "var(--radius-card)",
            background: "var(--rust-100)",
            border: "1px solid var(--rust-700)",
            font: "var(--type-body-sm)",
            color: "var(--rust-700)",
          }}
        >
          {serverError}
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <Divider label="Already have an account?" />

      <Button variant="secondary" size="md" fullWidth onClick={onSwitch} type="button">
        Sign in instead
      </Button>
    </form>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function AuthScreen() {
  const [panel, setPanel] = useState("login"); // "login" | "register"

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--sand-50)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* ── Header / branding ── */}
      <div
        style={{
          flex: "none",
          padding: "54px 24px 0",
          animation: "sv-rise 420ms cubic-bezier(.16,1,.3,1) both",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 32 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-xs)",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              font: "var(--weight-heavy) 14px/28px var(--font-display)",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            F
          </span>
          <span
            style={{
              font: "var(--weight-heavy) 22px/1 var(--font-display)",
              letterSpacing: "-.035em",
              color: "var(--text-strong)",
            }}
          >
            FlowGuard
          </span>
        </div>

        {/* Hero text */}
        <div
          style={{
            font: "var(--weight-heavy) 32px/1.1 var(--font-display)",
            letterSpacing: "-.03em",
            color: "var(--text-strong)",
            textWrap: "pretty",
            marginBottom: 10,
          }}
        >
          {panel === "login" ? "Welcome back" : "Join FlowGuard"}
        </div>
        <div
          style={{
            font: "var(--type-body)",
            color: "var(--text-muted)",
            textWrap: "pretty",
            marginBottom: 28,
          }}
        >
          {panel === "login"
            ? "Sign in to see your commutes and saved routes."
            : "Save your commutes, get proactive alerts, and earn rewards."}
        </div>

        {/* Tab strip */}
        <div
          style={{
            display: "flex",
            background: "var(--surface-sunken)",
            borderRadius: "var(--radius-control)",
            padding: 4,
            gap: 4,
            marginBottom: 28,
          }}
        >
          {[
            { id: "login", label: "Sign in" },
            { id: "register", label: "Create account" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPanel(tab.id)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: "calc(var(--radius-control) - 2px)",
                font: "var(--weight-bold) var(--size-body-sm)/1 var(--font-body)",
                cursor: "pointer",
                transition: "background .15s, color .15s, box-shadow .15s",
                ...(panel === tab.id
                  ? {
                      background: "var(--surface-card)",
                      color: "var(--text-strong)",
                      boxShadow: "var(--shadow-raised)",
                      border: "1px solid var(--border-hairline)",
                    }
                  : {
                      background: "transparent",
                      color: "var(--text-muted)",
                      border: "1px solid transparent",
                    }),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Form area ── */}
      <div
        key={panel}
        style={{
          flex: 1,
          padding: "0 24px 48px",
          animation: "sv-rise 300ms cubic-bezier(.16,1,.3,1) both",
        }}
      >
        {panel === "login" ? (
          <LoginPanel onSwitch={() => setPanel("register")} />
        ) : (
          <RegisterPanel onSwitch={() => setPanel("login")} />
        )}

        {/* ── Footer note ── */}
        <p
          style={{
            marginTop: 28,
            font: "var(--type-caption)",
            color: "var(--text-subtle)",
            textAlign: "center",
            textWrap: "pretty",
          }}
        >
          By continuing, you agree to FlowGuard's terms of service and privacy
          policy. Your data is stored securely and never shared.
        </p>
      </div>
    </div>
  );
}
