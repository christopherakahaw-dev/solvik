import { AppLogic } from "./state/appLogic";
import { AppHeader } from "./design-system";
import { Intro } from "./screens/Intro";
import { MapScreen } from "./screens/MapScreen";
import { NavScreen } from "./screens/NavScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { PlanScreen, PlacesSheet, AddCommuteSheet } from "./screens/PlanScreen";
import { TabBar } from "./screens/TabBar";
import { ViewportShell } from "./components/ViewportShell";
import { AuthScreen } from "./screens/AuthScreen";
import { useAuth } from "./auth/AuthContext";
import { setStorageScope } from "./lib/storage";
import "./app.css";

class AuthenticatedApp extends AppLogic {
  render() {
    const v = this.renderVals();
    return (
      <ViewportShell>
        {v.isIntro && <Intro v={v} />}
        {v.isMap && <MapScreen v={v} />}
        {v.isNav && <NavScreen v={v} />}

        {v.showStatus && (
          <>
            <AppHeader title={v.headerTitle} subtitle={v.headerSub} />
          </>
        )}

        {(v.isReport || v.isRewards || v.isPlan) && (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "0 16px calc(96px + env(safe-area-inset-bottom))" }}>
            {v.isReport && <ReportScreen v={v} />}
            {v.isRewards && <RewardsScreen v={v} />}
            {v.isPlan && <PlanScreen v={v} />}
          </div>
        )}

        <PlacesSheet v={v} />
        <AddCommuteSheet v={v} />

        {v.toast && (
          <div
            style={{
              position: "absolute", left: 16, right: 16, bottom: 92, zIndex: 50,
              background: "var(--surface-dark)", color: "var(--text-on-dark)", borderRadius: "var(--radius-lg)",
              padding: "14px 18px", font: "var(--weight-medium) var(--size-body-sm)/1.3 var(--font-body)",
              boxShadow: "var(--shadow-raised)", animation: "solvik-sheet-in var(--dur-base) var(--ease-out) both",
              textWrap: "pretty",
            }}
          >
            {v.toast}
          </div>
        )}

        {v.showTabs && <TabBar v={v} />}
      </ViewportShell>
    );
  }
}

function LoadingScreen() {
  return (
    <ViewportShell>
      <div className="sv-auth-screen" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--text-muted)" }} role="status">
          <span className="sv-auth-mark"><span style={{ font: "var(--weight-heavy) 18px/1 var(--font-display)" }}>S</span></span>
          <span style={{ font: "var(--type-body-strong)" }}>Opening Solvik…</span>
        </div>
      </div>
    </ViewportShell>
  );
}

export function App() {
  const { user, loading, recovery, completeOnboarding } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || recovery) return <ViewportShell><AuthScreen /></ViewportShell>;
  setStorageScope(user.isGuest ? "" : user.id);
  return <AuthenticatedApp user={user} onOnboardingComplete={completeOnboarding} key={user.id} />;
}
