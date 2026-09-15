import { Icon, IconButton, SearchField, Card, Tag, Button } from "../design-system";
import { OneMapCanvas } from "../components/OneMapCanvas";
import { styleText } from "../lib/styleText";

export function MapScreen({ v }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <OneMapCanvas
        center={v.mapCenter}
        zoom={12}
        route={v.routeCoords}
        marker={v.originCoord}
        dest={v.destCoord}
        pin={v.pinCoord}
        zones={v.mapZones}
        onZoneClick={v.fcPickZone}
        onMapClick={v.dropPin}
        zoomControls={false}
        height="100%"
      />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 14px 0", display: "flex", flexDirection: "column", gap: 10, maxHeight: "100%", pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px 8px", pointerEvents: "auto" }}>
          <div style={{ font: "var(--weight-bold) 13px/1 var(--font-numeric)", fontVariantNumeric: "tabular-nums", color: "var(--text-strong)" }}>
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 16, height: 9, border: "1.5px solid var(--sand-700)", borderRadius: 2 }} />
            <div style={{ width: 16, height: 9, border: "1.5px solid var(--sand-700)", borderRadius: 2, background: "linear-gradient(90deg,var(--sand-700) 62%,transparent 62%)" }} />
          </div>
        </div>

        {v.mapRoute && (
          <div style={{ pointerEvents: "auto", display: "flex", boxShadow: "var(--shadow-nav,0 10px 30px rgba(32,30,29,.16))", borderRadius: "var(--radius-pill,999px)", width: 44 }}>
            <IconButton icon="arrow-left" label="Back to search" tone="plain" size="md" onClick={v.backToSearch} />
          </div>
        )}

        {v.mapSearch && (
          <div style={{ pointerEvents: "auto", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div onFocusCapture={v.openSearch} onBlurCapture={v.closeSearch} style={{ flex: 1, minWidth: 0, borderRadius: "var(--radius-pill,999px)", boxShadow: "var(--shadow-nav,0 10px 30px rgba(32,30,29,.16))" }}>
              <SearchField value={v.query} placeholder="Search address, stop or area" icon="search" onChange={v.setQuery} onClear={v.clearQuery} />
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <button onClick={v.fcToggleAlerts} style={styleText(v.fcBellStyle)}>
                <Icon name="bell" size={20} strokeWidth={2.1} />
                {v.fcHasFaults && <span style={styleText(v.fcBellDotStyle)}>{v.fcFaultN}</span>}
              </button>
              <button onClick={v.toggleCrowd} title={v.crowdToggleLabel} style={styleText(v.crowdToggleStyle)}>
                <Icon name="layers" size={19} strokeWidth={2.1} />
              </button>
            </div>
          </div>
        )}

        {v.showResults && (
          <div style={{ pointerEvents: "auto", overflowY: "auto", maxHeight: 560, marginTop: -5, borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-nav,0 10px 30px rgba(32,30,29,.16))" }}>
            <Card tone="plain">
              <div style={{ font: "var(--weight-bold) var(--size-caption)/1.2 var(--font-body)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-muted)" }}>{v.resultsLabel}</div>
              {v.results.map((p, i) => (
                <button key={i} onClick={p.pick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-card)", padding: "14px 0", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{p.name}</div>
                    <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 4, textWrap: "pretty" }}>{p.detail}</div>
                  </div>
                  <Tag tone="neutral">{p.kind}</Tag>
                </button>
              ))}
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 14 }}>Results from OneMap · Singapore Land Authority</div>
            </Card>
          </div>
        )}
      </div>

      {v.mapRoute && (
        <div ref={v.setSheetRef} style={v.sheetWrapStyle}>
          <section style={v.sheetStyle}>
            <div onPointerDown={v.sheetDragStart} style={v.sheetGrabStyle}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "0 auto" }} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)", textWrap: "pretty" }}>{v.destName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>
                    <Icon name="map-pin" size={14} />
                    {v.destDetail}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", flex: "none" }}>
                  <Button variant="ghost" size="sm" onClick={v.backToSearch}>
                    Change
                  </Button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ font: "var(--weight-heavy) 11px/1 var(--font-body)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--text-muted)" }}>Prioritise</div>
                <div style={{ flex: 1, height: 1, background: "var(--border-card)" }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "2px 0 2px" }}>
                {v.tripModeTiles.map((m) => (
                  <button key={m.id} onClick={m.pick} style={styleText(m.tileStyle)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>{v.tripModeBlurb}</div>
              {v.tripOptions.map((o, i) => (
                <Card key={i} tone={o.tone} padding="tight" interactive onClick={o.pick}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{ font: "var(--weight-heavy) 32px/1 var(--font-numeric)", letterSpacing: "-.022em", fontVariantNumeric: "tabular-nums", color: "var(--text-strong)" }}>{o.mins}</span>
                    <span style={{ font: "var(--type-body)", color: "var(--text-muted)" }}>min</span>
                    <div style={{ marginLeft: "auto" }}>
                      <Tag tone={o.tagTone}>{o.tag}</Tag>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 6, font: "var(--type-caption)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="clock" size={14} />
                      {o.eta}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="wallet" size={14} />
                      {o.fare}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name="footprints" size={14} />
                      {o.walk}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {o.legs.map((l, li) => (
                      <span key={li} style={l.style}>
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        {o.bars.map((b, bi) => (
                          <span key={bi} style={b.style} />
                        ))}
                      </div>
                      <span style={{ font: "var(--weight-bold) var(--size-body-sm)/1 var(--font-body)", color: "var(--text-strong)" }}>{o.crowd}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>{o.note}</div>
                    <div style={{ flex: "none" }}>
                      <Button size="md" iconRight="navigation" onClick={o.start}>
                        Go
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div style={{ flex: "none", padding: "8px 0 14px", font: "var(--weight-regular) 10px/1.3 var(--font-body)", color: "var(--text-muted)", textAlign: "center", background: "var(--surface-card)" }}>
              Map data © OneMap · Singapore Land Authority
            </div>
          </section>
        </div>
      )}

      {v.fcPinned && (
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 88, zIndex: 16, padding: "14px 15px 15px", borderRadius: 22, background: "var(--surface-card)", boxShadow: "var(--shadow-sheet)", animation: "sv-rise 300ms cubic-bezier(.16,1,.3,1) both" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={styleText(v.fcPinned.dotStyle)} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ font: "var(--weight-heavy) 16px/1.2 var(--font-body)", letterSpacing: "-.012em", color: "var(--text-strong)", textWrap: "pretty" }}>{v.fcPinned.name}</div>
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 4, textWrap: "pretty" }}>{v.fcPinned.detail}</div>
            </div>
            <div style={{ flex: "none", textAlign: "right" }}>
              <div style={styleText(v.fcPinned.pctStyle)}>{v.fcPinned.pct}</div>
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 2 }}>{v.fcPinned.word}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 14 }}>
            {v.fcPinned.hours.map((h, i) => (
              <button key={i} onClick={h.pick} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <span style={styleText(h.barStyle)} />
                <span style={styleText(h.labelStyle)}>{h.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
            <Button size="md" iconLeft="bell" onClick={v.fcWatchPinned}>
              {v.fcWatchLabel}
            </Button>
            <Button variant="secondary" size="md" onClick={v.fcRoutesHere}>
              Routes
            </Button>
            <Button variant="ghost" size="md" onClick={v.fcClearPin}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {v.fcAlertsOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 24, background: "rgba(32,30,29,.34)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={v.fcToggleAlerts} style={{ flex: 1 }} />
          <section style={{ flex: "none", maxHeight: "76%", display: "flex", flexDirection: "column", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", padding: "0 16px 18px", animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ flex: "none", padding: "12px 0 6px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--border-strong)" }} />
            </div>
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, padding: "4px 0 12px" }}>
              <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)" }}>Alerts</div>
              <div style={styleText(v.fcFaultCountStyle)}>{v.fcFaultCount}</div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {v.fcHasUnread && (
                  <Button variant="ghost" size="sm" onClick={v.fcMarkAllRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={v.fcToggleAlerts}>
                  Close
                </Button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 4 }}>
              {v.fcFaults.map((f, i) => (
                <button key={i} onClick={f.toggleRead} style={styleText(f.cardStyle)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={styleText(f.badgeStyle)}>{f.line}</span>
                    <span style={styleText(f.tagStyle)}>{f.tag}</span>
                    <span style={styleText(f.readDotStyle)} />
                    <span style={{ marginLeft: "auto", font: "var(--type-caption)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{f.time}</span>
                  </div>
                  <div style={{ font: "var(--weight-bold) 14.5px/1.3 var(--font-body)", color: "var(--text-strong)", marginTop: 9, textWrap: "pretty" }}>{f.title}</div>
                  <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 5, textWrap: "pretty" }}>{f.detail}</div>
                  <div style={{ font: "var(--weight-bold) 11px/1 var(--font-body)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: 9 }}>{f.readLabel}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {v.hasPin && (
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 88, background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-sheet)", padding: "14px 15px", display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div style={{ flex: "none", width: 34, height: 34, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="map-pin" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{v.pinName}</div>
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, fontVariantNumeric: "tabular-nums", textWrap: "pretty" }}>{v.pinDetail}</div>
            </div>
            <IconButton icon="x" label="Remove pin" tone="ghost" size="sm" onClick={v.clearPin} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="md" fullWidth iconRight="arrow-right" onClick={v.pinDirections}>
              Routes here
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={v.pinSearch}>
              Search area
            </Button>
          </div>
        </div>
      )}

      {v.showCrowdBar && (
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 88, zIndex: 14, padding: "11px 12px 12px", borderRadius: 20, background: "var(--surface-card)", boxShadow: "var(--shadow-sheet)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {v.fcLegend.map((g, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={styleText(g.swatch)} />
                <span style={{ font: "var(--weight-semibold) 10.5px/1 var(--font-body)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{g.short}</span>
              </span>
            ))}
            <span style={{ marginLeft: "auto", font: "var(--weight-semibold) 10.5px/1 var(--font-body)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Tap an area for its outlook</span>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginTop: 10, paddingBottom: 2 }}>
            {v.fcSlots.map((h, i) => (
              <button key={i} onClick={h.pick} style={styleText(h.style)}>
                <span style={styleText(h.timeStyle)}>{h.label}</span>
                <span style={styleText(h.barStyle)} />
              </button>
            ))}
          </div>
        </div>
      )}

      {v.showPinHint && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 120, display: "flex", alignItems: "center", gap: 7, background: "var(--surface-card)", borderRadius: 999, padding: "8px 14px", boxShadow: "var(--shadow-nav)", font: "var(--type-caption)", color: "var(--text-body)", whiteSpace: "nowrap" }}>
          <Icon name="map-pin" size={14} />
          Tap anywhere to drop a pin
        </div>
      )}

      {v.showMapAttrib && (
        <div style={{ position: "absolute", left: 16, bottom: 92, font: "var(--weight-regular) 10px/1.3 var(--font-body)", color: "var(--sand-700)", textShadow: "0 1px 2px rgba(255,255,255,.9)" }}>
          Map data © OneMap · Singapore Land Authority
        </div>
      )}
    </div>
  );
}
