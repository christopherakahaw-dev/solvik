import { Icon, IconButton, Card, SectionLabel, TogglePill, Button } from "../design-system";

export function ReportScreen({ v }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>
      {v.reportPick && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative", overflow: "hidden", background: "var(--surface-dark)", color: "var(--text-on-dark)", borderRadius: "var(--radius-card)", padding: "16px 17px", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ position: "absolute", right: -30, top: -40, width: 130, height: 130, borderRadius: 999, background: "rgba(255,255,255,.06)" }} />
            <div style={{ position: "relative", flex: "none", width: 40, height: 40, borderRadius: 999, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="radar" size={20} />
            </div>
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--crowd-busy)", animation: "sv-ping 1.8s var(--ease-standard) infinite" }} />
                <span style={{ font: "var(--weight-bold) 11px/1 var(--font-body)", letterSpacing: ".07em", textTransform: "uppercase", opacity: 0.8 }}>{v.locEyebrow}</span>
              </div>
              <div style={{ font: "var(--weight-heavy) 18px/1.25 var(--font-display)", letterSpacing: "-.02em", marginTop: 7 }}>{v.locStopName}</div>
              <div style={{ font: "var(--type-caption)", opacity: 0.72, marginTop: 4, textWrap: "pretty" }}>{v.locDetail}</div>
            </div>
            <button onClick={v.locRecheck} style={{ position: "relative", flex: "none", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,.14)", border: "none", color: "var(--text-on-dark)", cursor: "pointer", font: "var(--weight-bold) 12px/1 var(--font-body)" }}>
              <Icon name="crosshair" size={14} />
              {v.locRecheckLabel}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {v.reportTypes.map((t, i) => (
              <Card key={i} tone={t.tone} padding="tight" interactive onClick={t.pick}>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={t.iconStyle}>
                    <Icon name={t.icon} size={17} />
                  </div>
                  <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{t.label}</div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>{t.sub}</div>
                  <div style={t.ptsStyle}>+{t.pts} pts</div>
                </div>
              </Card>
            ))}
          </div>

          <Card tone="plain">
            <SectionLabel>Nearby · last 30 min</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10 }}>
              {v.recentReports.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: "1px solid var(--border-card)" }}>
                  <div style={r.dotStyle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "var(--type-body)", color: "var(--text-body)", textWrap: "pretty" }}>{r.text}</div>
                    <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
                      {r.ago} ago · {r.votes} confirmed
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" iconLeft="thumbs-up" onClick={r.confirm}>
                    Still there
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {v.reportConfirm && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Button variant="ghost" size="sm" iconLeft="arrow-left" onClick={v.backToPick}>
            Change
          </Button>
          <Card tone="plain">
            <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>{v.chosenLabel}</div>
            <div style={{ font: "var(--type-body)", color: "var(--text-muted)", marginTop: 6 }}>{v.locStopName} · stays live 30 min</div>
            <div style={{ height: 14 }} />
            <SectionLabel>{v.severityQ}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {v.severities.map((s, i) => (
                <TogglePill key={i} pressed={s.on} onChange={s.pick} fullWidth>
                  {s.label}
                </TogglePill>
              ))}
            </div>
          </Card>
          <Card tone="plain">
            <SectionLabel>Photo · required</SectionLabel>
            {v.noPhoto && (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 10, padding: "26px 16px", borderRadius: "var(--radius-card)", border: "1px dashed var(--sand-400)", background: "var(--accent-soft)", cursor: "pointer", textAlign: "center" }}>
                <input type="file" accept="image/*" capture="environment" onChange={v.onPhoto} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
                <div style={{ width: 46, height: 46, borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="camera" size={22} />
                </div>
                <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)" }}>Take a photo</div>
                <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>Nearby commuters trust reports with a photo. Faces are blurred automatically.</div>
              </label>
            )}
            {v.hasPhoto && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <div style={{ flex: "none", width: 84, height: 84, borderRadius: "var(--radius-sm,12px)", overflow: "hidden", background: "var(--sand-100)" }}>{v.photoThumb}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)" }}>Photo attached</div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{v.photoName}</div>
                </div>
                <IconButton icon="x" label="Remove photo" tone="ghost" size="sm" onClick={v.clearPhoto} />
              </div>
            )}
          </Card>
          <Button size="lg" fullWidth disabled={v.noPhoto} onClick={v.submitReport}>
            {v.reportCta}
          </Button>
          <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textAlign: "center", textWrap: "pretty" }}>Shared anonymously with nearby commuters and LTA.</div>
        </div>
      )}

      {v.reportDone && (
        <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--accent)", color: "var(--text-on-accent)", font: "var(--weight-heavy) 28px/84px var(--font-numeric)", fontVariantNumeric: "tabular-nums" }}>{v.chosenPts}</div>
          <div style={{ font: "var(--type-title)", letterSpacing: "var(--tracking-title)", color: "var(--text-strong)" }}>Report is live</div>
          <div style={{ font: "var(--type-body)", color: "var(--text-muted)", maxWidth: 300, textWrap: "pretty" }}>247 commuters heading to Bishan in the next 15 minutes can see it.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Button size="md" onClick={v.goRewards}>
              See points
            </Button>
            <Button variant="secondary" size="md" onClick={v.backToPick}>
              Report again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
