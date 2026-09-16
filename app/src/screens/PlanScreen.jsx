import { Icon, IconButton, Button, SectionLabel, SearchField, Tag } from "../design-system";
import { styleText } from "../lib/styleText";
import { PlacePicker } from "../components/PlacePicker";

export function PlanScreen({ v }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14, paddingBottom: 104 }}>
      {v.planHasNext && (
        <div style={{ position: "relative", overflow: "hidden", background: "var(--surface-dark)", color: "var(--text-on-dark)", borderRadius: "var(--radius-card)", padding: 20, boxShadow: "var(--shadow-card)", animation: "sv-rise 420ms cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ position: "absolute", right: -46, top: -58, width: 180, height: 180, borderRadius: 999, background: "rgba(255,255,255,.05)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--crowd-moderate)", animation: "sv-ping 1.8s var(--ease-standard) infinite" }} />
            <span style={{ font: "var(--weight-bold) 11px/1 var(--font-body)", letterSpacing: ".09em", textTransform: "uppercase", opacity: 0.78 }}>Next up · {v.planNextIn}</span>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 12, marginTop: 14 }}>
            <div style={{ font: "var(--weight-heavy) 54px/1 var(--font-numeric)", letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{v.planNextLeave}</div>
            <div style={{ paddingBottom: 6 }}>
              <div style={{ font: "var(--weight-heavy) 17px/1.2 var(--font-display)", letterSpacing: "-.02em", textWrap: "pretty" }}>{v.planNextName}</div>
              <div style={{ font: "var(--type-caption)", opacity: 0.72, marginTop: 4, textWrap: "pretty" }}>{v.planNextRoute}</div>
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, marginTop: 14, font: "var(--type-caption)", opacity: 0.74, textWrap: "pretty" }}>{v.planNextNote}</div>
          <div style={{ position: "relative", display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
            <Button size="md" iconRight="arrow-right" onClick={v.startNext}>
              See routes
            </Button>
            <button onClick={v.watchNext} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 16px", height: 44, borderRadius: 999, cursor: "pointer", background: "rgba(255,255,255,.14)", border: "none", color: "var(--text-on-dark)", font: "var(--weight-bold) 14px/1 var(--font-body)" }}>
              <Icon name="bell" size={16} />
              Alert me
            </button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "0 13px", height: 44, borderRadius: 999, background: "rgba(255,255,255,.09)", font: "var(--weight-bold) 12px/1 var(--font-body)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--crowd-moderate)" }} />
              {v.planNextCrowd}
            </div>
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 4px 9px" }}>
          <SectionLabel>Your places</SectionLabel>
          <div style={{ marginLeft: "auto", flex: "none" }}>
            <Button variant="ghost" size="sm" iconLeft="pencil" onClick={v.openPlaces}>
              Edit
            </Button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
          {v.placeRows.map((p, i) => (
            <button key={i} onClick={v.openPlaces} style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", padding: "13px 12px", borderRadius: 20, cursor: "pointer", background: "var(--surface-card)", border: "1px solid var(--border-card)" }}>
              <span style={{ flex: "none", width: 30, height: 30, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={p.icon} size={15} />
              </span>
              <span style={{ display: "block", font: "var(--weight-bold) 10.5px/1 var(--font-body)", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{p.short}</span>
              <span style={{ display: "block", font: "var(--weight-bold) 13.5px/1.25 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>{p.shown}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 4px 9px" }}>
          <SectionLabel>Watched daily</SectionLabel>
          <div style={{ marginLeft: "auto", flex: "none" }}>
            <Button variant="ghost" size="sm" iconLeft="plus" onClick={v.openAdd}>
              Add
            </Button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {!v.saved.length && (
            <div style={{ padding: "16px 15px", borderRadius: 20, background: "var(--surface-card)", border: "1px solid var(--border-card)", font: "var(--type-body)", color: "var(--text-muted)", textWrap: "pretty" }}>
              No commutes yet. Add one and Solvik will watch it before you leave.
            </div>
          )}
          {v.saved.map((s, i) => (
            <button key={i} onClick={s.edit} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 15px", borderRadius: 20, cursor: "pointer", background: "var(--surface-card)", border: "1px solid var(--border-card)" }}>
              <span style={{ flex: "none", font: "var(--weight-heavy) 19px/1 var(--font-numeric)", fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", color: "var(--text-strong)" }}>{s.clock}</span>
              <span style={{ flex: "none", width: 1, height: 34, background: "var(--border-card)" }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", font: "var(--type-body-strong)", color: "var(--text-strong)" }}>{s.name}</span>
                <span style={{ display: "block", font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{s.sub}</span>
              </span>
              <Tag tone="soft">{s.mode}</Tag>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Rendered at the phone-frame level (not nested in the scrolling Plan
// content) so the sheet covers the whole screen, matching the prototype.
export function PlacesSheet({ v }) {
  return (
    <>
      {v.placesOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 32, background: "rgba(32,30,29,.34)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={v.closePlaces} style={{ flex: 1 }} />
          <section style={{ flex: "none", maxHeight: "80%", display: "flex", flexDirection: "column", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", padding: "0 18px 18px", animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ flex: "none", padding: "12px 0 6px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--sand-400)" }} />
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "4px 0 14px" }}>
              <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>Your places</div>
              <div style={{ marginLeft: "auto" }}>
                <Button variant="ghost" size="sm" onClick={v.closePlaces}>
                  Cancel
                </Button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 6 }}>
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>Selected places stay in this browser. Search text goes to OneMap while you search, and place coordinates only when you request a route. Solvik does not keep the search query.</div>
              {v.placeRows.map((p, i) => (
                <div key={i}>
                  <SectionLabel>{p.label}</SectionLabel>
                  <div style={{ marginTop: 8 }}>
                    <PlacePicker value={p.value} placeholder={p.placeholder} icon={p.icon} onChange={p.set} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={v.toggleSavedPlaces} aria-pressed={v.showSavedPlaces} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 13px", cursor: "pointer", textAlign: "left", background: "var(--sand-100)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-card)", color: "var(--text-body)" }}>
                <Icon name={v.showSavedPlaces ? "eye" : "eye-off"} size={17} />
                <span style={{ flex: 1, font: "var(--type-body-strong)" }}>Show saved places on the map</span>
                <span style={{ font: "var(--type-caption)", color: "var(--text-muted)" }}>{v.showSavedPlaces ? "On" : "Off"}</span>
              </button>
              <Button variant="ghost" size="md" fullWidth iconLeft="trash-2" onClick={v.clearAllData}>
                Erase all data from this device
              </Button>
            </div>
            <div style={{ flex: "none", paddingTop: 14 }}>
              <Button size="lg" fullWidth onClick={v.savePlaces}>
                Save addresses
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function AddCommuteSheet({ v }) {
  return (
    <>
      {v.addOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(32,30,29,.34)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={v.closeAdd} style={{ flex: 1 }} />
          <section style={{ position: "relative", flex: "none", maxHeight: "86%", display: "flex", flexDirection: "column", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", padding: "0 18px 18px", animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            {v.addSearchOpen && (
              <div style={{ position: "absolute", inset: 0, zIndex: 4, background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", padding: "12px 18px 18px", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: "none", display: "flex", justifyContent: "center", paddingBottom: 10 }}>
                  <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--sand-400)" }} />
                </div>
                <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, paddingBottom: 12 }}>
                  <IconButton icon="arrow-left" label="Back" tone="ghost" size="sm" onClick={v.addSearchClose} />
                  <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>{v.addSearchTitle}</div>
                </div>
                <div style={{ flex: "none" }}>
                  <SearchField value={v.addQuery} placeholder="Search address, stop or area" icon="search" onChange={v.setAddQuery} />
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 6 }}>
                  {v.addSearchPending && (
                    <div style={{ padding: "18px 4px", font: "var(--type-body)", color: "var(--text-muted)" }}>Searching…</div>
                  )}
                  {!v.addSearchPending && v.addSearchError && (
                    <div style={{ padding: "18px 4px", font: "var(--type-body)", color: "var(--status-fault)", textWrap: "pretty" }}>{v.addSearchError}</div>
                  )}
                  {v.addResults.map((r, i) => (
                    <button key={i} onClick={r.pick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-card)", padding: "14px 2px", cursor: "pointer" }}>
                      <div style={{ flex: "none", width: 32, height: 32, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="map-pin" size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: "var(--weight-bold) 15px/1.3 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" }}>{r.label}</div>
                        <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{r.detail}</div>
                      </div>
                      <Tag tone="neutral">{r.kind}</Tag>
                    </button>
                  ))}
                  {v.addNoResults && (
                    <div style={{ padding: "26px 4px", font: "var(--type-body)", color: "var(--text-muted)", textWrap: "pretty" }}>
                      No match for &ldquo;{v.addQuery}&rdquo;. Try a postal code, MRT stop or building name.
                    </div>
                  )}
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 14 }}>Results from OneMap · Singapore Land Authority</div>
                </div>
              </div>
            )}
            <div style={{ flex: "none", padding: "12px 0 6px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--sand-400)" }} />
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "4px 0 14px" }}>
              <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>{v.addSheetTitle}</div>
              <div style={{ marginLeft: "auto" }}>
                <Button variant="ghost" size="sm" onClick={v.closeAdd}>
                  Cancel
                </Button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 6 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SectionLabel>From</SectionLabel>
                  <div style={{ marginLeft: "auto", flex: "none" }}>
                    <IconButton icon="search" label="Search another place" tone="ghost" size="sm" onClick={v.addSearchFrom} />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 7 }}>
                  {v.addFromOpts.map((p, i) => (
                    <button key={i} onClick={p.pick} style={styleText(p.style)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <SectionLabel>To</SectionLabel>
                  <div style={{ marginLeft: "auto", flex: "none" }}>
                    <IconButton icon="search" label="Search another place" tone="ghost" size="sm" onClick={v.addSearchTo} />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 7 }}>
                  {v.addToOpts.map((p, i) => (
                    <button key={i} onClick={p.pick} style={styleText(p.style)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: "var(--radius-card)", background: "var(--accent-soft)" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ font: "var(--weight-bold) 11px/1 var(--font-body)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--text-muted)" }}>Leave by</div>
                  <div style={{ font: "var(--weight-heavy) 30px/1 var(--font-numeric)", fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", color: "var(--text-strong)", marginTop: 8 }}>{v.addTime}</div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 6, textWrap: "pretty" }}>{v.addArrive}</div>
                </div>
                <div style={{ flex: "none", display: "flex", gap: 8 }}>
                  <IconButton icon="minus" label="Earlier" tone="plain" size="md" onClick={v.addTimeDown} />
                  <IconButton icon="plus" label="Later" tone="plain" size="md" onClick={v.addTimeUp} />
                </div>
              </div>
              <div>
                <SectionLabel>Repeats · {v.addDaysLabel}</SectionLabel>
                <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                  {v.addDayOpts.map((d, i) => (
                    <button key={i} onClick={d.toggle} style={styleText(d.style)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                  {v.addDayPresets.map((p, i) => (
                    <button key={i} onClick={p.pick} style={styleText(p.style)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Watch for</SectionLabel>
                <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                  {v.addModeOpts.map((m, i) => (
                    <button key={i} onClick={m.pick} style={styleText(m.style)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 14px", borderRadius: "var(--radius-card)", border: "1px solid var(--border-card)" }}>
                <div style={{ flex: "none", width: 30, height: 30, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="bell" size={15} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{v.addPreviewName}</div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 4, textWrap: "pretty" }}>{v.addPreviewDetail}</div>
                </div>
              </div>
            </div>
            <div style={{ flex: "none", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <Button size="lg" fullWidth disabled={v.addInvalid} onClick={v.saveCommute}>
                {v.addCta}
              </Button>
              {v.addEditing && (
                <Button variant="ghost" size="md" fullWidth iconLeft="trash-2" onClick={v.deleteCommute}>
                  Delete commute
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
