import { useId, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button, Icon } from "../design-system";
import { SolvikBrand } from "../components/SolvikBrand";

function Field({ label, type = "text", value, onChange, error, hint, autoComplete, placeholder }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="sv-auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={`sv-auth-input-wrap${error ? " is-error" : ""}`}>
        <input
          id={id}
          type={password && visible ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          spellCheck={type === "email" ? "false" : undefined}
        />
        {password && (
          <button type="button" className="sv-auth-reveal" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"}>
            <Icon name={visible ? "eye-off" : "eye"} size={18} />
          </button>
        )}
      </div>
      {error ? <span id={`${id}-error`} className="sv-auth-field-error">{error}</span> : hint ? <span id={`${id}-hint`} className="sv-auth-hint">{hint}</span> : null}
    </div>
  );
}
function Notice({ tone = "error", children }) {
  return <div className={`sv-auth-notice sv-auth-notice-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

function LoginForm({ setView }) {
  const { configured, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sv-auth-form" onSubmit={submit} noValidate>
      <Field label="Email" type="email" value={email} onChange={(value) => { setEmail(value); setErrors((old) => ({ ...old, email: "" })); }} error={errors.email} autoComplete="email" placeholder="you@example.com" />
      <Field label="Password" type="password" value={password} onChange={(value) => { setPassword(value); setErrors((old) => ({ ...old, password: "" })); }} error={errors.password} autoComplete="current-password" placeholder="Your password" />
      <button className="sv-auth-link sv-auth-forgot" type="button" onClick={() => setView("forgot")}>Forgot password?</button>
      {message && <Notice>{message}</Notice>}
      <Button type="submit" size="lg" fullWidth disabled={busy || !configured}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function RegisterForm({ onConfirmed }) {
  const { configured, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Enter the name you want Solvik to use.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "The passwords do not match.";
    setErrors(next);
    setMessage("");
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await register(name.trim(), email.trim(), password);
      if (result.requiresConfirmation) onConfirmed(result.email);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sv-auth-form" onSubmit={submit} noValidate>
      <Field label="Name" value={name} onChange={(value) => { setName(value); setErrors((old) => ({ ...old, name: "" })); }} error={errors.name} autoComplete="name" placeholder="How should we address you?" />
      <Field label="Email" type="email" value={email} onChange={(value) => { setEmail(value); setErrors((old) => ({ ...old, email: "" })); }} error={errors.email} autoComplete="email" placeholder="you@example.com" />
      <Field label="Password" type="password" value={password} onChange={(value) => { setPassword(value); setErrors((old) => ({ ...old, password: "" })); }} error={errors.password} hint="At least 8 characters" autoComplete="new-password" placeholder="Create a password" />
      <Field label="Confirm password" type="password" value={confirm} onChange={(value) => { setConfirm(value); setErrors((old) => ({ ...old, confirm: "" })); }} error={errors.confirm} autoComplete="new-password" placeholder="Repeat your password" />
      {message && <Notice>{message}</Notice>}
      <Button type="submit" size="lg" fullWidth disabled={busy || !configured}>{busy ? "Creating account…" : "Create account"}</Button>
    </form>
  );
}

function ForgotPassword({ onBack }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter the email used for your account.");
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) return (
    <div className="sv-auth-form">
      <Notice tone="success"><strong>Check your email.</strong><br />If an account exists for {email.trim()}, a password-reset link is on its way.</Notice>
      <Button variant="secondary" size="md" fullWidth onClick={onBack}>Back to sign in</Button>
    </div>
  );

  return (
    <form className="sv-auth-form" onSubmit={submit} noValidate>
      <Field label="Account email" type="email" value={email} onChange={(value) => { setEmail(value); setError(""); }} error={error} autoComplete="email" placeholder="you@example.com" />
      <Button type="submit" size="lg" fullWidth disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
      <Button variant="ghost" size="md" fullWidth onClick={onBack}>Back to sign in</Button>
    </form>
  );
}

function UpdatePassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setError("");
    setBusy(true);
    try {
      await updatePassword(password);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sv-auth-form" onSubmit={submit} noValidate>
      <Field label="New password" type="password" value={password} onChange={(value) => { setPassword(value); setError(""); }} error={error} autoComplete="new-password" placeholder="At least 8 characters" />
      <Field label="Confirm new password" type="password" value={confirm} onChange={(value) => { setConfirm(value); setError(""); }} autoComplete="new-password" placeholder="Repeat your password" />
      <Button type="submit" size="lg" fullWidth disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
    </form>
  );
}

function Confirmation({ email, onBack }) {
  const { resendConfirmation } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    setMessage("");
    try {
      await resendConfirmation(email);
      setMessage("A fresh confirmation email has been sent.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sv-auth-form">
      <Notice tone="success"><strong>Confirm your email.</strong><br />We sent a confirmation link to {email}. Open it to finish creating your account.</Notice>
      {message && <Notice tone={message.startsWith("A fresh") ? "success" : "error"}>{message}</Notice>}
      <Button variant="secondary" size="md" fullWidth onClick={resend} disabled={busy}>{busy ? "Sending…" : "Resend email"}</Button>
      <Button variant="ghost" size="md" fullWidth onClick={onBack}>Back to sign in</Button>
    </div>
  );
}

export function AuthScreen() {
  const { configured, recovery, loginAsGuest } = useAuth();
  const [view, setView] = useState("login");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const activeView = recovery ? "recovery" : confirmationEmail ? "confirmation" : view;
  const title = activeView === "register" ? "Create your account" : activeView === "forgot" ? "Reset your password" : activeView === "recovery" ? "Choose a new password" : activeView === "confirmation" ? "One last step" : "Welcome back";
  const subtitle = activeView === "login" ? "Your saved commutes, available when you need them." : activeView === "register" ? "Sync only the places and commutes you choose." : activeView === "forgot" ? "We’ll send a secure link to your email." : activeView === "recovery" ? "Use a new password you haven’t used here before." : "Verify your address to protect your account.";

  return (
    <main className="sv-auth-screen">
      <div className="sv-auth-ambient" aria-hidden="true" />
      <section className="sv-auth-card" aria-labelledby="auth-title">
        <header className="sv-auth-brand">
          <SolvikBrand />
        </header>
        <div className="sv-auth-copy">
          <p className="sv-auth-eyebrow">Private commute companion</p>
          <h1 id="auth-title">{title}</h1>
          <p>{subtitle}</p>
        </div>

        {!configured && activeView !== "recovery" && (
          <Notice tone="setup"><strong>Account setup is not connected yet.</strong><br />Add the Supabase project URL and publishable key to enable sign-in. Guest mode remains available.</Notice>
        )}

        {(activeView === "login" || activeView === "register") && (
          <div className="sv-auth-tabs" role="tablist" aria-label="Account access">
            <button role="tab" aria-selected={activeView === "login"} onClick={() => setView("login")}>Sign in</button>
            <button role="tab" aria-selected={activeView === "register"} onClick={() => setView("register")}>Create account</button>
          </div>
        )}

        {activeView === "login" && <LoginForm setView={setView} />}
        {activeView === "register" && <RegisterForm onConfirmed={setConfirmationEmail} />}
        {activeView === "forgot" && <ForgotPassword onBack={() => setView("login")} />}
        {activeView === "recovery" && <UpdatePassword />}
        {activeView === "confirmation" && <Confirmation email={confirmationEmail} onBack={() => { setConfirmationEmail(""); setView("login"); }} />}

        {(activeView === "login" || activeView === "register") && (
          <div className="sv-auth-guest">
            <span>or</span>
            <Button variant="secondary" size="md" fullWidth iconLeft="user-round" onClick={loginAsGuest}>Continue as guest</Button>
            <p>No account required. Guest places and commutes stay in this browser.</p>
          </div>
        )}
      </section>
      <p className="sv-auth-footer">Solvik never uploads live location, search history, or learned journeys.</p>
    </main>
  );
}
