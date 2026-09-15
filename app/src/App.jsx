import { AppLogic } from "./state/appLogic";
import { AppHeader } from "./design-system";
import { Intro } from "./screens/Intro";
import { MapScreen } from "./screens/MapScreen";
import { NavScreen } from "./screens/NavScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { PlanScreen, PlacesSheet, AddCommuteSheet } from "./screens/PlanScreen";
import { TabBar } from "./screens/TabBar";
import "./app.css";

export class App extends AppLogic {
  render() {
    const v = this.renderVals();
    return (
      <div className="solvik-app-shell">
        {v.isIntro && <Intro v={v} />}
        {v.isMap && <MapScreen v={v} />}
        {v.isNav && <NavScreen v={v} />}

        {v.showStatus && (
          <>
            <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px 0", background: "var(--surface-card)" }}>
              <div style={{ font: "var(--weight-bold) 13px/1 var(--font-numeric)", fontVariantNumeric: "tabular-nums", color: "var(--text-strong)" }}>
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 16, height: 9, border: "1.5px solid var(--sand-500)", borderRadius: 2 }} />
                <div style={{ width: 16, height: 9, border: "1.5px solid var(--sand-500)", borderRadius: 2, background: "linear-gradient(90deg,var(--sand-500) 62%,transparent 62%)" }} />
              </div>
            </div>
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
