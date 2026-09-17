import { Icon } from "../design-system";

// Bottom nav — icon-only (no text labels under the icons), per the mobile
// build spec. The sliding mint pill and per-tab hover/press/dot behavior are
// otherwise unchanged from the prototype.
export function TabBar({ v }) {
  return (
    <div className="sv-tab-bar" role="navigation" aria-label="Main navigation" style={{ position: "absolute", left: 14, right: 14, bottom: "calc(14px + env(safe-area-inset-bottom))", zIndex: 20 }}>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", padding: 7, background: "var(--surface-card)", borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-nav)" }}>
        <span aria-hidden="true" style={v.tabPill} />
        {v.navTabs.map((t) => (
          <button key={t.id} onClick={t.go} onMouseEnter={t.enter} onMouseLeave={t.leave} onMouseDown={t.down} onMouseUp={t.up} style={t.style} aria-label={t.label}>
            <span style={t.iconStyle}>
              <Icon name={t.icon} size={21} strokeWidth={2.1} />
              {t.dot ? <span style={t.dotStyle} /> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
