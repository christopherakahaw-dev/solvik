import { AppLogic } from "./state/appLogic";
import { AppHeader } from "./design-system";
import { Intro } from "./screens/Intro";
import { MapScreen } from "./screens/MapScreen";
import { NavScreen } from "./screens/NavScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { PlanScreen, PlacesSheet, AddCommuteSheet } from "./screens/PlanScreen";
import { TabBar } from "./screens/TabBar";
import { AuthScreen } from "./screens/AuthScreen";
import { useAuth } from "./auth/AuthContext";
import "./app.css";

// ── Loading splash shown for ~200 ms while we check the session cookie ────────
function LoadingSplash() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--sand-50)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-xs)",
          background: "var(--accent)",
          color: "var(--text-on-accent)",
          font: "var(--weight-heavy) 18px/36px var(--font-display)",
          textAlign: "center",
          display: "block",
        }}
      >
        F
      </span>
      <span
        style={{
          font: "var(--weight-heavy) 20px/1 var(--font-display)",
          letterSpacing: "-.03em",
          color: "var(--text-strong)",
        }}
      >
        FlowGuard
      </span>
    </div>
  );
}

// ── Main authenticated app shell (unchanged internals) ────────────────────────
class AuthenticatedApp extends AppLogic {
  render() {
    const v = this.renderVals();
    return (
      <div className="solvik-app-shell">
        {v.isIntro && <Intro v={v} />}
        {v.isMap && <MapScreen v={v} />}
        {v.isNav && <NavScreen v={v} />}

        {v.showStatus && (
          <>
            <AppHeader title={v.headerTitle} subtitle={v.headerSub} />
          </>
        )}

        {(v.isReport || v.isRewards || v.isPlan) && (
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 16px 96px" }}>
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
      </div>
    );
  }
}

// ── Root — decides which shell to show ───────────────────────────────────────
export function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSplash />;
  if (!user)   return <AuthScreen />;

  return <AuthenticatedApp user={user} />;
}

