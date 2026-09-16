import { Icon, Button, SectionLabel } from "../design-system";
import { PlacePicker } from "../components/PlacePicker";
import { styleText } from "../lib/styleText";

export function Intro({ v }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--sand-50)", display: "flex", flexDirection: "column", padding: "54px 20px 22px" }}>
      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 24, height: 24, borderRadius: "var(--radius-xs)", background: "var(--accent)", color: "var(--text-on-accent)", font: "var(--weight-heavy) 13px/24px var(--font-display)", textAlign: "center" }}>S</span>
        <span style={{ font: "var(--weight-heavy) 20px/1 var(--font-display)", letterSpacing: "-.035em", color: "var(--text-strong)" }}>Solvik</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          {v.introDots.map((d, i) => (
            <span key={i} style={d.style} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 26 }}>
        {v.introS0 && (
          <div style={{ animation: "sv-rise 420ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ font: "var(--weight-heavy) 38px/1.1 var(--font-display)", letterSpacing: "-.03em", color: "var(--text-strong)", textWrap: "pretty" }}>
              Your commute, minus the guesswork
            </div>
            <div style={{ font: "var(--type-body)", color: "var(--text-muted)", marginTop: 14, textWrap: "pretty" }}>
              Tell Solvik who you are and where you go. It then watches your lines, warns you before you leave, and routes around the crush.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 28 }}>
              {v.introPromises.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-card)" }}>
                  <span style={{ flex: "none", width: 34, height: 34, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={p.icon} size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "var(--type-body-strong)", color: "var(--text-strong)" }}>{p.title}</span>
                    <span style={{ display: "block", font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{p.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {v.introS1 && (
          <div style={{ animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ font: "var(--weight-heavy) 30px/1.15 var(--font-display)", letterSpacing: "-.028em", color: "var(--text-strong)", textWrap: "pretty" }}>How do you travel?</div>
            <div style={{ font: "var(--type-body)", color: "var(--text-muted)", marginTop: 10, textWrap: "pretty" }}>Pick everything that applies. This decides which routes Solvik offers first.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 22 }}>
              {v.introRoles.map((r) => (
                <button key={r.id} onClick={r.toggle} style={styleText(r.style)}>
                  <span style={styleText(r.iconStyle)}>
                    <Icon name={r.icon} size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <span style={{ display: "block", font: "var(--type-body-strong)" }}>{r.label}</span>
                    <span style={styleText(r.subStyle)}>{r.sub}</span>
                  </span>
                  <span style={styleText(r.checkStyle)}>
                    <Icon name="check" size={14} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {v.introS2 && (
          <div style={{ animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ font: "var(--weight-heavy) 30px/1.15 var(--font-display)", letterSpacing: "-.028em", color: "var(--text-strong)", textWrap: "pretty" }}>Where do you go most?</div>
            <div style={{ font: "var(--type-body)", color: "var(--text-muted)", marginTop: 10, textWrap: "pretty" }}>Two or three places is enough. Solvik watches the lines between them.</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 14, padding: "11px 12px", borderRadius: "var(--radius-card)", background: "var(--accent-soft)", color: "var(--text-body)" }}>
              <Icon name="shield-check" size={17} style={{ flex: "none", marginTop: 1 }} />
              <span style={{ font: "var(--type-caption)", textWrap: "pretty" }}>Selected places stay in this browser. Search text goes to OneMap while you search, and coordinates only when you ask for a route. Location remains off until you ask to use it.</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
              {v.introPlaces.map((f, i) => (
                <div key={i}>
                  <SectionLabel>{f.label}</SectionLabel>
                  <div style={{ marginTop: 8 }}>
                    <PlacePicker value={f.value} placeholder={f.placeholder} icon={f.icon} onChange={f.set} suggestions={f.suggestions} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {v.introS3 && (
          <div style={{ animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ font: "var(--weight-heavy) 30px/1.15 var(--font-display)", letterSpacing: "-.028em", color: "var(--text-strong)", textWrap: "pretty" }}>{v.introSummaryTitle}</div>
            <div style={{ font: "var(--type-body)", color: "var(--text-muted)", marginTop: 10, textWrap: "pretty" }}>You can change any of this later in Plan.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              {v.introSummary.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "14px 15px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-card)" }}>
                  <span style={{ flex: "none", width: 26, height: 26, borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="check" size={14} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, font: "var(--type-body)", color: "var(--text-body)", textWrap: "pretty" }}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 9, paddingTop: 14 }}>
        <Button size="lg" fullWidth onClick={v.introNext}>
          {v.introCta}
        </Button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {v.introCanBack ? (
            <Button variant="ghost" size="sm" iconLeft="arrow-left" onClick={v.introBack}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div style={{ marginLeft: "auto" }}>
            <Button variant="ghost" size="sm" onClick={v.introSkip}>
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
