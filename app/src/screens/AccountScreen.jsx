import { useState } from "react";
import { Button, Icon } from "../design-system";
import { useAuth } from "../auth/AuthContext";

const syncCopy = {
  loading: "Checking cloud data…",
  saving: "Saving securely…",
  ready: "Cloud data is up to date",
  error: "Cloud sync needs attention",
  conflict: "Choose which saved data to keep",
};

export function AccountScreen({ v }) {
  const { user, profileError, logout, updateProfile, setCloudSync, clearCloudData, deleteAccount } = useAuth();
  const [name, setName] = useState(user.name || "");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const initial = (user.name || user.email || "G").charAt(0).toUpperCase();

  async function run(key, action, success = "") {
    setBusy(key);
    setMessage("");
    try {
      await action();
      if (success) setMessage(success);
    } catch (error) {
      setMessage(error.message || "That action could not be completed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="sv-account-page">
      <section className="sv-account-hero">
        <span className="sv-account-page-avatar">{initial}</span>
        <div>
          <span className="sv-account-eyebrow">{user.isGuest ? "Private guest session" : "Solvik account"}</span>
          <h2>{user.name || (user.isGuest ? "Guest" : "Your profile")}</h2>
          <p>{user.isGuest ? "Your data stays in this browser." : user.email}</p>
        </div>
        <span className="sv-account-state"><i />{user.isGuest ? "Local" : "Signed in"}</span>
      </section>

      {!user.isGuest && (
        <div className="sv-account-page-grid">
          <section className="sv-account-section">
            <div className="sv-account-section-title">
              <span><Icon name="user-round" size={18} /></span>
              <div><h3>Profile</h3><p>The name shown across Solvik.</p></div>
            </div>
            <label className="sv-account-field">
              <span>Display name</span>
              <input value={name} maxLength={80} autoComplete="name" onChange={(event) => setName(event.target.value)} />
            </label>
            <Button size="sm" disabled={Boolean(busy) || name.trim() === (user.name || "")} onClick={() => run("profile", () => updateProfile({ name }), "Profile updated")}>Save profile</Button>
          </section>

          <section className="sv-account-section">
            <div className="sv-account-section-title">
              <span><Icon name="cloud" size={18} /></span>
              <div><h3>Saved-data sync</h3><p>Carry places and preferences between devices.</p></div>
            </div>
            <button className="sv-account-sync-row" type="button" aria-pressed={user.cloudSync} disabled={Boolean(busy)} onClick={() => run("sync", () => setCloudSync(!user.cloudSync))}>
              <span><strong>Sync saved data</strong><small>Places, commutes and route preferences</small></span>
              <span className="sv-switch" aria-hidden="true"><i /></span>
            </button>
            <p className="sv-account-local-note"><Icon name="shield-check" size={15} />Live location, searches and learned journeys always stay on this device.</p>
            {user.cloudSync && syncCopy[v.cloudSyncStatus] && <p className="sv-sync-status" role="status">{syncCopy[v.cloudSyncStatus]}</p>}
            {(profileError || message || (user.cloudSync && v.cloudSyncError)) && <p className="sv-account-page-message" role="alert">{profileError || message || v.cloudSyncError}</p>}
            {user.cloudSync && v.cloudSyncConflict && (
              <div className="sv-sync-choice">
                <p>This device and your account both have saved data. Nothing has been overwritten.</p>
                <div>
                  <Button size="sm" onClick={() => run("device", v.keepDeviceData)} disabled={Boolean(busy)}>Keep this device</Button>
                  <Button variant="secondary" size="sm" onClick={() => run("cloud", v.useCloudData)} disabled={Boolean(busy)}>Use cloud data</Button>
                </div>
              </div>
            )}
            {user.cloudSync && v.cloudSyncStatus === "error" && <Button variant="secondary" size="sm" onClick={() => run("retry", v.retryCloudSync)} disabled={Boolean(busy)}>Try sync again</Button>}
          </section>
        </div>
      )}

      <section className="sv-account-section sv-account-actions-page">
        <div className="sv-account-section-title">
          <span><Icon name="settings-2" size={18} /></span>
          <div><h3>Account actions</h3><p>Manage your session and stored account data.</p></div>
        </div>
        <div className="sv-account-action-list">
          {!user.isGuest && <button type="button" disabled={Boolean(busy)} onClick={() => {
            if (window.confirm("Delete saved places, commutes and preferences from the cloud? Data on this device will remain.")) run("clear", clearCloudData, "Cloud data cleared");
          }}><span><Icon name="cloud-off" size={18} /><span><strong>Clear cloud data</strong><small>Keep the data on this device</small></span></span><Icon name="chevron-right" size={17} /></button>}
          <button type="button" disabled={Boolean(busy)} onClick={() => run("logout", logout)}><span><Icon name="log-out" size={18} /><span><strong>{busy === "logout" ? "Signing out…" : "Sign out"}</strong><small>Return to the login page</small></span></span><Icon name="chevron-right" size={17} /></button>
          {!user.isGuest && <button type="button" className="is-danger" disabled={Boolean(busy)} onClick={() => {
            if (window.confirm("Permanently delete your Solvik account and cloud data? This cannot be undone.")) run("delete", deleteAccount);
          }}><span><Icon name="trash-2" size={18} /><span><strong>Delete account</strong><small>Permanently remove your account</small></span></span><Icon name="chevron-right" size={17} /></button>}
        </div>
      </section>
    </main>
  );
}
