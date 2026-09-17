import { useEffect, useState } from "react";
import { Icon, IconButton, SearchField, Card, Tag, Button } from "../design-system";
import { OneMapCanvas } from "../components/OneMapCanvas";
import { PlacePicker } from "../components/PlacePicker";
import { AppMenu } from "../components/AppMenu";
import { SolvikBrand } from "../components/SolvikBrand";
import { styleText } from "../lib/styleText";

export function MapScreen({ v }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRouteFor, setOpenRouteFor] = useState(null);
  const [dismissedRouteFor, setDismissedRouteFor] = useState(null);
  const [moreModesOpen, setMoreModesOpen] = useState(false);
  const routeSummary = v.tripOptions?.[0];
  const routeReady = Boolean(v.destName && !v.tripsPending && routeSummary);
  const routePanelOpen = Boolean(v.destName && (openRouteFor === v.destName || (routeReady && dismissedRouteFor !== v.destName)));
  const primaryModes = v.tripModeTiles.filter((mode) => ["fast", "quiet", "step"].includes(mode.id));
  const secondaryModes = v.tripModeTiles.filter((mode) => !["fast", "quiet", "step"].includes(mode.id));
  const secondaryActive = secondaryModes.find((mode) => mode.id === v.tripMode);

  useEffect(() => {
    if (!menuOpen && !routePanelOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setOpenRouteFor(null);
      setDismissedRouteFor(v.destName);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, routePanelOpen, v.destName]);

  return (
    <div className={`sv-map-screen${v.mapRoute ? " has-route" : ""}${v.showCrowdBar ? " has-crowd" : ""}`} style={{ position: "absolute", inset: 0 }}>
      <OneMapCanvas
        center={v.mapCenter}
        zoom={12}
        route={v.routeCoords}
        compareRoute={v.compareRouteCoords}
        affected={v.affectedSpans}
        marker={v.userMarker}
        markerAccuracy={v.userAccuracy}
        origin={v.routeOriginCoord}
        dest={v.destCoord}
        pin={v.pinCoord}
        savedPlaces={v.savedPlaceMarkers}
        zones={v.mapZones}
        onZoneClick={v.fcPickZone}
        onMapClick={v.dropPin}
        zoomControls={false}
        recenterToken={v.recenterToken}
        height="100%"
      />

      <div className="sv-map-overlay-stack">
        <div className="sv-map-topbar">
          <div className="sv-map-leading">
            <button
              type="button"
              className="sv-map-control sv-map-menu-button sv-logo-menu-button"
              aria-label="Open menu"
              title="Open Solvik menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="route" size={20} strokeWidth={2.35} />
              <span className="sv-logo-menu-cue" aria-hidden="true"><Icon name="menu" size={13} strokeWidth={2.8} /></span>
            </button>
            <SolvikBrand compact className="sv-map-brand" />
          </div>

          {v.mapSearch ? (
            <div
              className={`sv-map-search-wrap${v.searchPending ? " is-searching" : ""}`}
              onFocusCapture={v.openSearch}
              onBlurCapture={v.closeSearch}
              onKeyDown={(e) => {
                if (e.key === "Escape") v.dismissSearch();
              }}
            >
              <SearchField value={v.query} placeholder={v.searchPlaceholder} icon="search" onChange={v.setQuery} onClear={v.clearQuery} />
            </div>
          ) : (
            <button type="button" className={`sv-map-route-search${v.tripsPending ? " is-planning" : ""}`} onClick={v.backToSearch} aria-label="Change destination">
              <Icon name="search" size={18} />
              <span>{v.destName || "Search address, stop or area"}</span>
              <Icon name="x" size={18} />
            </button>
          )}

          <div className="sv-map-top-actions">
              <button className="sv-map-action sv-map-action-alert" onClick={v.fcToggleAlerts} aria-label="Alerts" title="Alerts" style={styleText(v.fcBellStyle)}>
                <Icon name="bell" size={20} strokeWidth={2.1} />
                {v.fcHasFaults && <span style={styleText(v.fcBellDotStyle)}>{v.fcFaultN}</span>}
              </button>
              <button className={`sv-map-action sv-map-action-crowd${v.showCrowdBar ? " is-active" : ""}`} onClick={v.toggleCrowd} aria-label={v.crowdToggleLabel} title={v.crowdToggleLabel} style={styleText(v.crowdToggleStyle)}>
                <Icon name="layers" size={19} strokeWidth={2.1} />
              </button>
          </div>
        </div>

        {v.showRecents && (
          <div className="sv-map-results">
            <Card tone="plain">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ font: "var(--weight-bold) var(--size-caption)/1.2 var(--font-body)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-muted)" }}>Recent</div>
                <div style={{ marginLeft: "auto" }}>
                  <Button variant="ghost" size="sm" onClick={v.clearRecents}>Clear</Button>
                </div>
              </div>
              {v.recents.map((p, i) => (
                <button
                  key={i}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={p.pick}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-card)", padding: "13px 0", cursor: "pointer" }}
                >
                  <span style={{ flex: "none", width: 30, height: 30, borderRadius: 999, background: "var(--accent-soft)", color: "var(--text-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="history" size={15} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{p.name}</span>
                    <span style={{ display: "block", font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{p.detail}</span>
                  </span>
                </button>
              ))}
            </Card>
          </div>
        )}

        {v.showResults && (
          <div className="sv-map-results">
            <Card tone="plain">
              <div style={{ font: "var(--weight-bold) var(--size-caption)/1.2 var(--font-body)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--text-muted)" }}>{v.resultsLabel}</div>
              {v.searchPending && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 0", font: "var(--type-body)", color: "var(--text-muted)" }}>
                  <Icon name="loader-2" size={16} style={{ animation: "sv-spin 900ms linear infinite" }} />
                  Searching…
                </div>
              )}
              {!v.searchPending && v.searchError && (
                <div style={{ padding: "16px 0", font: "var(--type-body)", color: "var(--status-fault)", textWrap: "pretty" }}>
                  {v.searchError}
                </div>
              )}
              {!v.searchPending && !v.searchError && v.searchEmpty && (
                <div style={{ padding: "16px 0", font: "var(--type-body)", color: "var(--text-muted)", textWrap: "pretty" }}>
                  No match for “{v.query.trim()}”. Try a postal code, MRT stop or building name.
                </div>
              )}
              {v.results.map((p, i) => (
                <button key={i} onMouseDown={(event) => event.preventDefault()} onClick={p.pick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid var(--border-card)", padding: "14px 0", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{p.name}</div>
                    <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 4, textWrap: "pretty" }}>{p.detail}</div>
                  </div>
                  <Tag tone="neutral">{p.kind}</Tag>
                </button>
              ))}
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 14 }}>{v.searchFooter}</div>
            </Card>
          </div>
        )}
      </div>

      {menuOpen && <AppMenu v={v} onClose={() => setMenuOpen(false)} />}

      {v.mapRoute && !routePanelOpen && (
        <button
          type="button"
          className="sv-route-summary"
          aria-expanded="false"
          onClick={() => { setDismissedRouteFor(null); setOpenRouteFor(v.destName); }}
        >
          <span className="sv-route-summary-icon"><Icon name="route" size={17} /></span>
          <span className="sv-route-summary-places">{v.routeOriginName} <span aria-hidden="true">→</span> {v.destName}</span>
          <strong>{v.tripsPending ? "Finding route…" : routeSummary ? `${routeSummary.mins} min` : "View routes"}</strong>
          <Icon name="chevron-up" size={17} />
        </button>
      )}

      {v.mapRoute && (
        <div ref={v.setSheetRef} className={`sv-route-sheet-wrap${routePanelOpen ? " is-open" : ""}`} style={v.sheetWrapStyle}>
          <section className="sv-route-sheet" style={v.sheetStyle} aria-label="Route options">
            <button type="button" className="sv-route-panel-close" aria-label="Collapse route options" onClick={() => { setOpenRouteFor(null); setDismissedRouteFor(v.destName); }}>
              <Icon name="x" size={18} />
            </button>
            <div onPointerDown={v.sheetDragStart} style={v.sheetGrabStyle}>
              <div style={{ width: 42, height: 4, borderRadius: 999, background: "var(--border-strong)", margin: "0 auto" }} />
            </div>
            <div className="sv-scroll-stack" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 10 }}>
              <div className="sv-route-location-block">
                <div className="sv-origin-picker">
                  <PlacePicker key={v.routeOriginReset} value={v.routeOriginPlace} displayValue={v.routeOriginDisplay} clearOnFocus placeholder="Search starting place" icon="circle-dot" onChange={v.setRouteOrigin} onDraftChange={v.setRouteOriginDraft} showDetails={false} />
                  <div className="sv-origin-shortcuts">
                    {v.originPresets.map((preset) => <button key={preset.id} type="button" disabled={preset.disabled} aria-pressed={preset.active} onClick={preset.pick}>
                      <Icon name={preset.icon} size={14} />{preset.label}
                    </button>)}
                  </div>
                </div>
                <div className="sv-route-destination-head">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ font: "var(--type-heading)", letterSpacing: "var(--tracking-heading)", color: "var(--text-strong)", textWrap: "pretty" }}>{v.destName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>
                      <Icon name="map-pin" size={14} />
                      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{v.destDetail}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={v.backToSearch}>
                    Change
                  </Button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ font: "var(--weight-heavy) 11px/1 var(--font-body)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--text-muted)" }}>Prioritise</div>
                <div style={{ flex: 1, height: 1, background: "var(--border-card)" }} />
              </div>
              <div className="sv-route-mode-primary">
                {primaryModes.map((m) => (
                  <button key={m.id} aria-pressed={v.tripMode === m.id} onClick={m.pick} style={styleText(m.tileStyle)}>
                    {m.label}
                  </button>
                ))}
                <button type="button" className={`sv-route-mode-more${secondaryActive ? " is-active" : ""}`} aria-expanded={moreModesOpen} onClick={() => setMoreModesOpen((open) => !open)}>
                  <Icon name="sliders-horizontal" size={15} />
                  <span>{secondaryActive ? secondaryActive.label : "More options"}</span>
                  <Icon name={moreModesOpen ? "chevron-up" : "chevron-down"} size={14} />
                </button>
              </div>
              {moreModesOpen && (
                <div className="sv-route-mode-secondary" aria-label="More route preferences">
                  {secondaryModes.map((m) => (
                    <button key={m.id} aria-pressed={v.tripMode === m.id} onClick={() => { m.pick(); setMoreModesOpen(false); }}>
                      <span>{m.label}</span>
                      {v.tripMode === m.id && <Icon name="check" size={15} />}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", textWrap: "pretty" }}>{v.tripModeBlurb}</div>
              {v.recordedNotice && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 11px", borderRadius: 999, background: "var(--sand-100,rgba(32,30,29,.05))", font: "var(--weight-semibold) 11.5px/1.2 var(--font-body)", color: "var(--text-muted)", textWrap: "pretty" }}>
                  <Icon name="circle-dot-dashed" size={14} />
                  {v.recordedNotice}
                </div>
              )}
              {v.tripsPending && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "18px 0", font: "var(--type-body)", color: "var(--text-muted)" }}>
                  <Icon name="loader-2" size={16} style={{ animation: "sv-spin 900ms linear infinite" }} />
                  Planning your trip…
                </div>
              )}
              {!v.tripsPending && v.tripsError && (
                <div style={{ padding: "18px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ font: "var(--type-body)", color: "var(--status-fault)", textWrap: "pretty" }}>{v.tripsError}</div>
                  <div><Button variant="secondary" size="sm" onClick={v.retryTrips}>Try again</Button></div>
                </div>
              )}
              {!v.tripsPending && !v.tripsError && v.tripsEmpty && (
                <div style={{ padding: "18px 0", font: "var(--type-body)", color: "var(--text-muted)", textWrap: "pretty" }}>
                  {v.tripsEmptyNote}
                </div>
              )}
              {v.tripsAvoiding && (
                <div style={{ font: "var(--weight-semibold) 11px/1 var(--font-body)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-accent)", padding: "2px 0 4px" }}>
                  {v.tripsAvoiding}
                </div>
              )}
              {v.tripOptions.map((o, i) => (
                <Card className="sv-route-option-card" key={i} tone={o.tone} padding="tight" interactive onClick={o.pick} style={{ "--sv-card-index": i }}>
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
                    <button type="button" aria-expanded={o.expanded} onClick={(event) => { event.stopPropagation(); o.pick(); }} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, font: "var(--weight-semibold) 11px/1 var(--font-body)", color: "var(--text-muted)", border: 0, padding: "8px 0", background: "transparent", cursor: "pointer" }}>
                      {o.detailHint}
                      <Icon name={o.expanded ? "chevron-up" : "chevron-down"} size={13} />
                    </button>
                  </div>

                  {o.expanded && o.details.length > 0 && (
                    <div ref={o.detailsRef} style={{ marginTop: 12, paddingLeft: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                      {o.details.map((d, di) => (
                        <div key={di} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                            <span style={styleText(d.iconWrapStyle)}>
                              <Icon name={d.icon} size={15} />
                            </span>
                            {di < o.details.length - 1 && (
                              <span style={{ flex: 1, width: 2, minHeight: 12, background: "var(--border-card)", borderRadius: 999, margin: "3px 0" }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingBottom: di < o.details.length - 1 ? 12 : 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ font: "var(--type-body-strong)", color: "var(--text-strong)", textWrap: "pretty" }}>{d.title}</span>
                              <span style={{ font: "var(--type-caption)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{d.meta}</span>
                            </div>
                            {d.board && (
                              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 3, textWrap: "pretty" }}>{d.board}</div>
                            )}
                            {d.alight && (
                              <div style={{ font: "var(--type-caption)", color: "var(--text-muted)", marginTop: 2, textWrap: "pretty" }}>{d.alight}</div>
                            )}
                            {d.arrival && d.arrival.text && (
                              <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                                <span style={styleText(d.loadDotStyle)} />
                                <span style={styleText(d.arrivalStyle)}>{d.arrival.text}</span>
                                {d.crowdLabel && <span style={{ ...styleText(d.crowdStyle), marginLeft: 8 }}>{d.crowdLabel}</span>}
                              </div>
                            )}
                            {!(d.arrival && d.arrival.text) && d.crowdLabel && (
                              <div style={{ marginTop: 6 }}>
                                <span style={styleText(d.crowdStyle)}>{d.crowdLabel}</span>
                              </div>
                            )}
                            {d.stops.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                                {d.stops.map((sp, si) => (
                                  <span key={si} style={styleText(d.stopChipStyle)}>{sp}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      <Button size="md" iconRight="navigation" onClick={o.start} disabled={o.recorded}>
                        {o.recorded ? "Preview only" : "Go"}
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
        <div className="sv-map-card-overlay" style={{ position: "absolute", left: 14, right: 14, bottom: 88, zIndex: 16, padding: "14px 15px 15px", borderRadius: 22, background: "var(--surface-card)", boxShadow: "var(--shadow-sheet)", animation: "sv-rise 300ms cubic-bezier(.16,1,.3,1) both" }}>
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
        <div className="sv-map-modal-layer" style={{ position: "absolute", inset: 0, zIndex: 24, background: "rgba(32,30,29,.34)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={v.fcToggleAlerts} style={{ flex: 1 }} />
          <section className="sv-map-modal-sheet" style={{ flex: "none", maxHeight: "76%", display: "flex", flexDirection: "column", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", padding: "0 16px 18px", animation: "sv-rise 320ms cubic-bezier(.16,1,.3,1) both" }}>
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
              {v.faultsPending && (
                <div style={{ padding: "14px 0", font: "var(--type-body)", color: "var(--text-muted)" }}>Checking LTA for disruptions…</div>
              )}
              {!v.faultsPending && v.faultsError && (
                <div style={{ padding: "14px 0", font: "var(--type-body)", color: "var(--status-fault)", textWrap: "pretty" }}>{v.faultsError}</div>
              )}
              {!v.faultsPending && !v.faultsError && v.faultsClear && (
                <div style={{ padding: "14px 0", font: "var(--type-body)", color: "var(--text-muted)" }}>Normal service on all lines.</div>
              )}
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
                  {f.placeNote && (
                    <div style={{ font: "var(--type-caption)", color: "var(--text-accent)", marginTop: 6, textWrap: "pretty" }}>{f.placeNote}</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
                    <span style={{ font: "var(--weight-bold) 11px/1 var(--font-body)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-muted)" }}>{f.readLabel}</span>
                    {f.canReroute && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); f.reroute(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); f.reroute(); } }}
                        style={{ marginLeft: "auto", cursor: "pointer", font: "var(--weight-bold) 11.5px/1 var(--font-body)", color: "var(--text-accent)", padding: "6px 10px", borderRadius: 999, background: "var(--accent-soft)", whiteSpace: "nowrap" }}
                      >
                        Find another way
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {v.hasPin && (
        <div className="sv-map-card-overlay" style={{ position: "absolute", left: 14, right: 14, bottom: 88, background: "var(--surface-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-sheet)", padding: "14px 15px", display: "flex", flexDirection: "column", gap: 11 }}>
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
        <div ref={v.setCrowdBarRef} className={`sv-crowd-bar${v.fcSlots.length <= 2 ? " is-sparse" : ""}`} style={{ position: "absolute", left: 14, right: 14, bottom: "calc(94px + env(safe-area-inset-bottom))", zIndex: 14, padding: "11px 12px 12px", borderRadius: 20, background: "var(--surface-card)", boxShadow: "var(--shadow-sheet)" }}>
          <div className="sv-crowd-summary" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {v.fcLegend.map((g, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={styleText(g.swatch)} />
                <span style={{ font: "var(--weight-semibold) 10.5px/1 var(--font-body)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{g.short}</span>
              </span>
            ))}
            <span className="sv-crowd-help" style={{ flexBasis: "100%", font: "var(--weight-semibold) 10.5px/1.3 var(--font-body)", color: v.crowdError ? "var(--status-fault)" : "var(--text-muted)" }}>
              {v.crowdError ? "Crowding unavailable" : v.crowdPending ? "Loading crowding…" : v.crowdEmpty ? "No crowding data" : "Tap a station for its level"}
            </span>
          </div>
          <div className="sv-crowd-slots" style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", marginTop: 10, paddingBottom: 2 }}>
            {v.fcSlots.map((h, i) => (
              <button key={i} onClick={h.pick} aria-pressed={h.active} style={styleText(h.style)}>
                <span style={styleText(h.timeStyle)}>{h.label}</span>
                <span style={styleText(h.barStyle)} />
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className={`sv-map-locate${v.hasFix ? " has-fix" : ""}`}
        onClick={v.locateMe}
        aria-label="Show my location"
        title="Show my location"
        style={{
          position: "absolute",
          right: 14,
          "--sv-locate-mobile-bottom": v.locateBottom,
          maxHeight: 46,
          zIndex: 18,
          width: 46,
          height: 46,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: "none",
          background: "var(--surface-card)",
          color: v.hasFix ? "var(--text-accent)" : "var(--text-strong)",
          boxShadow: "0 4px 14px rgba(32,30,29,.18)",
          transition: "bottom var(--dur-base) var(--ease-out),color var(--dur-fast) var(--ease-standard)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Icon
          name={v.locating ? "loader-2" : "locate-fixed"}
          size={20}
          strokeWidth={2.1}
          style={v.locating ? { animation: "sv-spin 900ms linear infinite" } : undefined}
        />
      </button>

      {v.showPinHint && (
        <div className="sv-map-pin-hint">
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
