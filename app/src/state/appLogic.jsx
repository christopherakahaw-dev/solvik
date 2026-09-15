import { Component } from "react";
import { searchPlaces } from "../api/onemap";
import { getTrainServiceAlerts } from "../api/lta";
import { getTripOptions } from "../api/trips";
import { getCrowding } from "../api/crowding";
import { getNearestStop } from "../api/stop";
import { getPosition, watchPosition, clearWatch, messageForError } from "../lib/geolocation";
import { fractionAlong } from "../lib/geometry";

const ONBOARDED_KEY = "solvik:onboarded";
const PLACES_KEY = "solvik:places";
const COMMUTES_KEY = "solvik:commutes";

function loadStored(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the session still works.
  }
}

// Used until the browser gives us a real fix: Blk 726 Yishun St 71, the
// starting point the prototype was designed around.
const ORIGIN_FALLBACK = [1.4294, 103.835];

// Ported from the Onward.dc.html prototype's embedded view-model script,
// almost verbatim. Every screen's render() calls `this.renderVals()` and
// reads off the same keys the prototype's `{{ }}` template bindings used, so
// this file stays the single source of truth for what each screen shows and
// how it behaves — only the render/JSX layer changed medium.
export const CROWD = { light: "var(--crowd-light)", moderate: "var(--crowd-moderate)", busy: "var(--crowd-busy)" };
export const WORD = { light: "Light", moderate: "Moderate", busy: "Busy" };

export class AppLogic extends Component {
  state = {
    savedList: loadStored(COMMUTES_KEY, []),
    ...loadStored(PLACES_KEY, { plHome: "", plWork: "", plSchool: "" }),
    addEdit: null, placesOpen: false,
    addOpen: false, addFrom: "home", addTo: "work", addDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    addMode: "Comfort", addMins: 462, fcSlot: 0, fcPin: null, fcAlerts: false, fcWatch: [],
    hoverTab: null, pressTab: null, sheetH: 430, sheetDrag: false, navRoute: null, navStart: null,
    navPage: 0, stepsDrag: false, pin: null,
    screen: typeof localStorage !== "undefined" && localStorage.getItem(ONBOARDED_KEY) ? "map" : "intro",
    rep: "pick", repType: null, sev: 1, points: 2480, toast: null, tick: 0,
    query: "", dest: null, searchOpen: false, tripMode: "fast", tripRoute: 0,
    userLoc: null, userAccuracy: null, locating: false, recenterToken: 0,
    // Remote data, each held with its own pending/error so screens can say
    // exactly what is missing instead of showing invented values.
    trips: { key: null, options: [], pending: false, error: null },
    crowd: { stations: [], slots: [], at: null, pending: false, error: null },
    faults: { items: [], pending: false, error: null },
    stop: { data: null, pending: false, error: null },
  };

  currentOrigin() {
    return this.state.userLoc || ORIGIN_FALLBACK;
  }

  // Centre the map on the real position and adopt it as the trip origin.
  locateMe = () => {
    this.requestCurrentLocation(true);
  };

  requestCurrentLocation = (recenter = false) => {
    if (this.state.userLoc) return Promise.resolve(this.state.userLoc);
    if (this._locationPromise) return this._locationPromise;

    this.setState({ locating: true });
    this._locationPromise = getPosition()
      .then((fix) => {
        this.setState((st) => ({
          userLoc: fix.coords,
          userAccuracy: fix.accuracy,
          locating: false,
          recenterToken: recenter ? st.recenterToken + 1 : st.recenterToken,
          fcPin: recenter ? null : st.fcPin,
        }));
        return fix.coords;
      })
      .catch((err) => {
        this.setState({ locating: false });
        if (recenter) this.flash(messageForError(err && err.code));
        throw err;
      })
      .finally(() => {
        this._locationPromise = null;
      });
    return this._locationPromise;
  };

  addCommuteVals(s) {
    // Only places the user actually told us about, plus anything they've
    // searched for in this sheet. Nothing invented.
    const PLACES = [
      s.plHome && { id: "home", label: "Home", place: s.plHome },
      s.plWork && { id: "work", label: "Work", place: s.plWork },
      s.plSchool && { id: "school", label: "School", place: s.plSchool },
    ].filter(Boolean).concat(s.addExtra || []);
    const addSearch = s.addSearchResults || { items: [], pending: false, error: null, query: "" };
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const from = s.addFrom || "home", to = s.addTo || "work";
    const days = s.addDays || ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const mode = s.addMode || "Comfort";
    const mins = s.addMins == null ? 462 : s.addMins;
    const fromP = PLACES.find((p) => p.id === from) || PLACES[0] || null;
    const toP = PLACES.find((p) => p.id === to) || PLACES[1] || null;
    const clock = (m) => String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
    const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const dayLabel =
      days.length === 0 ? "no days yet"
      : days.length === 7 ? "every day"
      : weekday.every((d) => days.indexOf(d) >= 0) && days.length === 5 ? "Mon to Fri"
      : days.length === 2 && days.indexOf("Sat") >= 0 && days.indexOf("Sun") >= 0 ? "weekends"
      : DAYS.filter((d) => days.indexOf(d) >= 0).join(", ");
    const pill = (on) =>
      "flex:none;padding:10px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;" +
      "font:var(--weight-bold) 13px/1 var(--font-body);transition:background .15s,color .15s;" +
      (on
        ? "background:var(--accent);border:1px solid var(--accent);color:var(--text-on-accent);"
        : "background:var(--accent-soft);border:1px solid var(--border-card);color:var(--text-body);");
    const aq = (s.addQuery || "").trim();
    const aResults = addSearch.query === aq ? addSearch.items : [];
    const invalid = !fromP || !toP || from === to || days.length === 0;
    const name = invalid ? "" : fromP.label + " → " + toP.label;
    return {
      addOpen: !!s.addOpen,
      closeAdd: () => this.setState({ addOpen: false, addEdit: null }),
      addFromOpts: PLACES.map((p) => ({ label: p.label, style: pill(p.id === from), pick: () => this.setState({ addFrom: p.id }) })),
      addToOpts: PLACES.map((p) => ({ label: p.label, style: pill(p.id === to), pick: () => this.setState({ addTo: p.id }) })),
      addSearchOpen: !!s.addSearchFor,
      addSearchTitle: s.addSearchFor === "to" ? "Where are you going?" : "Where do you start?",
      addSearchFrom: () => this.setState({ addSearchFor: "from", addQuery: "" }),
      addSearchTo: () => this.setState({ addSearchFor: "to", addQuery: "" }),
      addSearchClose: () => this.setState({ addSearchFor: null, addQuery: "" }),
      addQuery: s.addQuery || "",
      setAddQuery: (v) => this.setState({ addQuery: typeof v === "string" ? v : v && v.target ? v.target.value : "" }),
      addNoResults: !!aq && !addSearch.pending && !addSearch.error && aResults.length === 0,
      addResults: aResults.map((p) => ({
        label: p.name,
        detail: p.detail,
        kind: p.kind,
        pick: () => {
          const entry = { id: p.id, label: p.name, place: p.detail, ll: p.ll };
          const extra = (s.addExtra || []).filter((x) => x.id !== p.id).concat([entry]).slice(-4);
          const key = s.addSearchFor === "to" ? "addTo" : "addFrom";
          this.setState({ addExtra: extra, [key]: p.id, addSearchFor: null, addQuery: "" });
        },
      })),
      addSearchPending: !!addSearch.pending,
      addSearchError: addSearch.error || null,
      addTime: clock(mins),
      addArrive: !PLACES.length
        ? "Add your home and work addresses first, or search for a place."
        : invalid
        ? "Pick two different places and at least one day."
        : "Solvik checks this trip 25 min before you leave.",
      addTimeUp: () => this.setState({ addMins: mins + 5 }),
      addTimeDown: () => this.setState({ addMins: mins - 5 }),
      addDaysLabel: dayLabel,
      addDayOpts: DAYS.map((d) => {
        const on = days.indexOf(d) >= 0;
        return {
          label: d.slice(0, 1),
          toggle: () => this.setState({ addDays: on ? days.filter((x) => x !== d) : DAYS.filter((x) => days.indexOf(x) >= 0 || x === d) }),
          style: "flex:1;min-width:0;height:40px;border-radius:999px;cursor:pointer;font:var(--weight-bold) 13px/1 var(--font-body);" +
            (on ? "background:var(--accent);border:1px solid var(--accent);color:var(--text-on-accent);" : "background:var(--sand-100);border:1px solid var(--border-card);color:var(--text-muted);"),
        };
      }),
      addDayPresets: [
        { label: "Weekdays", set: weekday },
        { label: "Weekends", set: ["Sat", "Sun"] },
        { label: "Every day", set: DAYS },
      ].map((p) => ({
        label: p.label,
        pick: () => this.setState({ addDays: p.set }),
        style: "flex:none;padding:8px 13px;border-radius:999px;cursor:pointer;font:var(--weight-semibold) 12px/1 var(--font-body);background:var(--surface-card);border:1px solid var(--border-card);color:var(--text-body)",
      })),
      addModeOpts: ["Fastest", "Comfort", "Step-free"].map((m) => ({ label: m, style: pill(m === mode), pick: () => this.setState({ addMode: m }) })),
      addPreviewName: invalid ? "Not ready yet" : "Alerts for " + name,
      addPreviewDetail: invalid ? "Choose a different destination, or tap a day." : "Checked 25 min before " + clock(mins) + " on " + dayLabel.toLowerCase() + ". " + mode + " routes preferred.",
      addInvalid: invalid,
      addEditing: s.addEdit != null,
      addSheetTitle: s.addEdit != null ? "Edit commute" : "Add a commute",
      addCta: invalid ? "Pick places and days" : s.addEdit != null ? "Save changes · " + name : "Save · watch " + name,
      deleteCommute: () => {
        const list = (s.savedList || []).filter((x, i) => i !== s.addEdit);
        this.setState({ savedList: list, addOpen: false, addEdit: null });
        this.flash("Commute removed");
      },
      saved: (s.savedList || []).map((c, i) => {
        const f = PLACES.find((p) => p.id === c.from) || { label: c.from, place: c.from };
        const t = PLACES.find((p) => p.id === c.to) || { label: c.to, place: c.to };
        const ds = c.days || [];
        const dl =
          ds.length === 0 ? "no days"
          : ds.length === 7 ? "every day"
          : ds.length === 5 && weekday.every((d) => ds.indexOf(d) >= 0) ? "Mon to Fri"
          : ds.length === 2 && ds.indexOf("Sat") >= 0 && ds.indexOf("Sun") >= 0 ? "weekends"
          : DAYS.filter((d) => ds.indexOf(d) >= 0).join(", ");
        return {
          name: f.label + " → " + t.label,
          clock: clock(c.mins),
          sub: f.place + " → " + t.place + " · " + dl,
          detail: f.place + " → " + t.place + " · " + dl + ", " + clock(c.mins),
          mode: c.mode,
          edit: () => this.setState({ addOpen: true, addEdit: i, addFrom: c.from, addTo: c.to, addDays: ds.slice(), addMins: c.mins, addMode: c.mode }),
        };
      }),
      ...(() => {
        const list = s.savedList || [];
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const next = list.slice().sort((a, b) => {
          const da = (a.mins - nowMins + 1440) % 1440, db = (b.mins - nowMins + 1440) % 1440;
          return da - db;
        })[0];
        if (!next) return { planHasNext: false, planNextName: "", planNextLeave: "", planNextIn: "", planNextRoute: "", planNextNote: "", planNextCrowd: "", startNext: () => {}, watchNext: () => {} };
        const f = PLACES.find((p) => p.id === next.from) || { label: next.from, place: next.from };
        const t = PLACES.find((p) => p.id === next.to) || { label: next.to, place: next.to };
        const inMins = (next.mins - nowMins + 1440) % 1440;
        return {
          planHasNext: true,
          planNextName: f.label + " → " + t.label,
          planNextLeave: clock(next.mins),
          planNextIn: inMins < 60 ? "leave in " + inMins + " min" : "leave in " + Math.floor(inMins / 60) + " h " + (inMins % 60) + " min",
          planNextRoute: f.place + " → " + t.place,
          planNextNote: next.mode.toLowerCase() + " routes · checked 25 min before you leave",
          planNextCrowd: (() => {
            const stations = (s.crowd && s.crowd.stations) || [];
            if (!stations.length) return "";
            const busy = stations.filter((st) => st.level === "busy").length;
            return busy ? busy + " busy now" : "Network light";
          })(),
          startNext: () => { this.setState({ screen: "map" }); this.flash("Routes for " + f.label + " → " + t.label + " · leave " + clock(next.mins)); },
          watchNext: () => this.flash("Alert set · 25 min before " + clock(next.mins)),
        };
      })(),
      openAdd: () => this.setState({ addOpen: true, addEdit: null, addFrom: "home", addTo: "work", addDays: weekday.slice(), addMins: 462, addMode: "Comfort" }),
      placesOpen: !!s.placesOpen,
      openPlaces: () => this.setState({ placesOpen: true }),
      closePlaces: () => this.setState({ placesOpen: false }),
      savePlaces: () => { this.setState({ placesOpen: false }); this.flash("Places saved · " + ((s.plHome || "Yishun") + " → " + (s.plWork || "Raffles Place"))); },
      placeRows: [
        { key: "plHome", label: "Home", short: "Home", icon: "house", placeholder: "Block, street or MRT stop" },
        { key: "plWork", label: "Work", short: "Work", icon: "briefcase", placeholder: "Office, building or area" },
        { key: "plSchool", label: "School or campus", short: "School", icon: "graduation-cap", placeholder: "Optional" },
      ].map((p) => ({
        label: p.label, short: p.short, icon: p.icon, placeholder: p.placeholder,
        value: s[p.key] || "",
        shown: (s[p.key] || "").trim() || "Add",
        set: (v) => this.setState({ [p.key]: typeof v === "string" ? v : v && v.target ? v.target.value : "" }),
      })),
      saveCommute: () => {
        if (invalid) return;
        const entry = { from, to, days: days.slice(), mins, mode };
        const list = (s.savedList || []).slice();
        if (s.addEdit != null) list[s.addEdit] = entry;
        else list.push(entry);
        this.setState({ savedList: list, addEdit: null, addOpen: false });
        this.flash("Watching " + name + " · " + dayLabel + ", " + clock(mins));
      },
    };
  }

  forecastVals(s) {
    const crowd = s.crowd || { stations: [], slots: [] };
    const stations = crowd.stations || [];
    const level = (st) => st.level || "light";
    const tone = (lv) => "var(--crowd-" + lv + ")";
    const word = { busy: "Busy", moderate: "Filling", light: "Light" };

    const pinned = s.crowdOn !== false ? stations.find((st) => st.code === s.fcPin) || null : null;
    const watched = s.fcWatch || [];
    const crowdOn = s.crowdOn !== false;

    const zones = stations.map((st) => ({
      id: st.code,
      ll: [st.lat, st.lng],
      // Station-scale circles, not the prototype's district blobs.
      radius: 320,
      level: level(st),
      label: st.name,
      pct: st.pct != null ? st.pct + "%" : "",
      selected: st.code === s.fcPin,
    }));

    const faults = s.faults || { items: [], error: null };
    const sevTone = { fault: "var(--status-fault)", warn: "var(--status-warn)", info: "var(--sand-500)" };
    const fcRead = s.fcRead || [];
    const unread = faults.items.map((f, i) => i).filter((i) => fcRead.indexOf(i) < 0);

    const slots = crowd.slots || [];
    const slotIndex = Math.min(s.fcSlot || 0, Math.max(0, slots.length - 1));
    const slotLabel = (iso) => {
      const d = new Date(iso);
      return isNaN(d) ? String(iso) : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    return {
      crowdOn,
      crowdPending: !!crowd.pending,
      crowdError: crowd.error || null,
      crowdEmpty: !crowd.pending && !crowd.error && stations.length === 0,
      mapZones: crowdOn && !s.dest ? zones : [],
      showCrowdBar: crowdOn && !s.dest && !s.searchOpen && !(s.query || "").trim() && !s.fcPin && !s.pin,
      toggleCrowd: () => this.setState({ crowdOn: !crowdOn, fcPin: null }),
      crowdToggleLabel: crowdOn ? "Crowding layer on" : "Crowding layer off",
      crowdToggleStyle: "position:relative;flex:none;width:46px;height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;box-shadow:0 4px 14px rgba(32,30,29,.18);" +
        (crowdOn ? "background:var(--accent);color:var(--text-on-accent,#fff);" : "background:var(--surface-card);color:var(--text-body);"),
      fcPickZone: (id) => this.setState({ fcPin: id, fcAlerts: false, pin: null, searchOpen: false }),
      fcRoutesHere: () => {
        if (!pinned) return;
        this.setState({
          dest: { name: pinned.name, detail: word[level(pinned)] + " now · platform crowding from LTA", ll: [pinned.lat, pinned.lng] },
          fcPin: null,
          tripRoute: 0,
        });
      },
      fcClearPin: () => this.setState({ fcPin: null }),
      fcWatchLabel: pinned && watched.indexOf(pinned.code) >= 0 ? "Watching" : "Alert me",
      fcWatchPinned: () => {
        if (!pinned) return;
        const on = watched.indexOf(pinned.code) >= 0;
        this.setState({ fcWatch: on ? watched.filter((x) => x !== pinned.code) : watched.concat([pinned.code]) });
        this.flash(on ? "Stopped watching " + pinned.name : "Alerts on for " + pinned.name);
      },
      fcPinned: pinned && {
        name: pinned.name,
        detail: pinned.code + " · platform crowding, LTA DataMall",
        pct: pinned.pct != null ? pinned.pct + "%" : "",
        word: word[level(pinned)],
        dotStyle: "flex:none;margin-top:4px;width:12px;height:12px;border-radius:999px;background:" + tone(level(pinned)),
        pctStyle: "font:var(--weight-heavy) 24px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + tone(level(pinned)),
        hours: [],
      },
      fcLegend: ["busy", "moderate", "light"].map((lv) => ({
        label: { busy: "Busy — expect to stand", moderate: "Filling up", light: "Light — seats likely" }[lv],
        short: { busy: "Busy", moderate: "Filling", light: "Light" }[lv],
        swatch: "width:9px;height:9px;border-radius:999px;flex:none;background:" + tone(lv) + ";opacity:.9",
      })),
      // Scrubber slots are the forecast intervals LTA actually publishes.
      fcSlots: slots.map((iso, n) => {
        const on = n === slotIndex;
        return {
          label: n === 0 ? "Now" : slotLabel(iso),
          pick: () => this.setState({ fcSlot: n }),
          style: "flex:none;display:flex;flex-direction:column;align-items:center;gap:7px;padding:9px 13px;border-radius:14px;cursor:pointer;transition:background .16s,border-color .16s;" +
            (on ? "background:var(--accent);border:1.5px solid var(--accent);" : "background:var(--sand-100);border:1.5px solid var(--border-card);"),
          timeStyle: "font:var(--weight-bold) 12.5px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + (on ? "#fff" : "var(--text-body)"),
          barStyle: "display:block;width:30px;height:4px;border-radius:999px;background:" + (on ? "#fff" : "var(--sand-400)") + ";opacity:" + (on ? 0.9 : 0.8),
        };
      }),
      fcFaults: faults.items.map((f, fi) => ({
        ...f,
        readLabel: fcRead.indexOf(fi) >= 0 ? "Read" : "Tap to mark as read",
        readDotStyle: fcRead.indexOf(fi) >= 0 ? "display:none" : "width:7px;height:7px;border-radius:999px;background:var(--status-fault)",
        toggleRead: () => {
          if (fcRead.indexOf(fi) < 0) this.setState({ fcRead: fcRead.concat([fi]) });
        },
        cardStyle: "width:100%;text-align:left;display:block;cursor:pointer;padding:13px 14px;border-radius:16px;background:var(--surface-card);opacity:" + (fcRead.indexOf(fi) >= 0 ? ".6" : "1") + ";border:1px solid " + (fcRead.indexOf(fi) >= 0 ? "var(--border-card)" : sevTone[f.sev] || "var(--border-card)"),
        badgeStyle: "flex:none;padding:3px 8px;border-radius:999px;font:var(--weight-heavy) 11px/1.3 var(--font-body);letter-spacing:.02em;color:#fff;background:" + (sevTone[f.sev] || "var(--sand-500)"),
        tagStyle: "font:var(--weight-semibold) 11px/1 var(--font-body);letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)",
      })),
      faultsPending: !!faults.pending,
      faultsError: faults.error || null,
      faultsClear: !faults.pending && !faults.error && faults.items.length === 0,
      fcFaultCount: unread.length ? unread.length + " unread" : "All read",
      fcFaultN: unread.length,
      fcHasFaults: unread.length > 0,
      fcHasUnread: unread.length > 0,
      fcMarkAllRead: () => { this.setState({ fcRead: faults.items.map((f, i) => i) }); this.flash("All alerts marked read"); },
      fcAlertsOpen: !!s.fcAlerts,
      fcToggleAlerts: () => this.setState({ fcAlerts: !s.fcAlerts }),
      fcBellStyle: "position:relative;flex:none;margin-left:auto;width:46px;height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;color:" +
        (s.fcAlerts ? "#fff" : "var(--text-strong)") + ";background:" + (s.fcAlerts ? "var(--text-strong)" : "var(--surface-card)") + ";box-shadow:0 4px 14px rgba(32,30,29,.18)",
      fcBellDotStyle: "position:absolute;top:5px;right:5px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:var(--weight-heavy) 10.5px/1 var(--font-numeric);color:#fff;background:var(--status-fault);border:2px solid " + (s.fcAlerts ? "var(--text-strong)" : "var(--surface-card)"),
      fcFaultCountStyle: "font:var(--weight-bold) 11px/1 var(--font-body);padding:4px 9px;border-radius:999px;color:var(--status-fault);background:color-mix(in oklch, var(--status-fault) 12%, transparent)",
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.screen === "nav" && this.stepsEl) {
      const idx = this._navIdx || 0;
      if (idx !== this._scrolledTo && (!this.userScrolled || Date.now() - this.userScrolled > 6000)) {
        this._scrolledTo = idx;
        this.stepsEl.scrollTo({ left: idx * (this.stepsEl.clientWidth + 10), behavior: "smooth" });
        if (idx !== this.state.navPage) this.setState({ navPage: idx });
      }
    }
    if (this.state.query !== prevState.query) this.scheduleLiveSearch();
    if (this.state.addQuery !== prevState.addQuery) this.scheduleAddSearch();

    // Anything that changes what a journey looks like re-asks OneMap.
    const s = this.state;
    if (
      s.dest &&
      s.screen !== "nav" &&
      (s.dest !== prevState.dest || s.tripMode !== prevState.tripMode || s.userLoc !== prevState.userLoc)
    ) {
      this.loadTripOptions();
    }
    // Scrubbing to another forecast slot re-asks LTA.
    if (s.fcSlot !== prevState.fcSlot) this.loadCrowding(s.crowd.slots[s.fcSlot] || null);

    if (s.savedList !== prevState.savedList) store(COMMUTES_KEY, s.savedList);
    if (s.plHome !== prevState.plHome || s.plWork !== prevState.plWork || s.plSchool !== prevState.plSchool) {
      store(PLACES_KEY, { plHome: s.plHome, plWork: s.plWork, plSchool: s.plSchool });
    }

    if (s.screen === "nav" && prevState.screen !== "nav") this.startTracking();
    if (s.screen !== "nav" && prevState.screen === "nav") this.stopTracking();
  }
  componentDidMount() {
    this.t0 = Date.now();
    this.iv = setInterval(() => this.setState({ tick: Date.now() }), 1000);
    if (this.state.screen === "map") this.requestCurrentLocation().catch(() => {});
    this.loadFaults();
    this.loadCrowding();
    this.findNearestStop();
  }
  componentWillUnmount() {
    clearInterval(this.iv);
    if (this.tt) clearTimeout(this.tt);
    if (this._searchT) clearTimeout(this._searchT);
    if (this._addSearchT) clearTimeout(this._addSearchT);
    this.stopTracking();
  }

  // Turn-by-turn follows the real position rather than a simulated clock.
  startTracking = () => {
    this.stopTracking();
    this.watchId = watchPosition(
      (fix) => this.setState({ userLoc: fix.coords, userAccuracy: fix.accuracy }),
      (err) => this.flash(messageForError(err && err.code))
    );
  };
  stopTracking = () => {
    if (this.watchId != null) {
      clearWatch(this.watchId);
      this.watchId = null;
    }
  };

  // Live OneMap place search, debounced. Falls back to the illustrative
  // PLACES list in renderVals() whenever this fails or a key isn't set.
  scheduleLiveSearch = () => {
    if (this._searchT) clearTimeout(this._searchT);
    const query = this.state.query;
    if (!query || query.trim().length < 2) {
      this.setState({ liveResults: null, searchPending: false, searchError: null });
      return;
    }
    this.setState({ searchPending: true });
    this._searchT = setTimeout(async () => {
      try {
        const items = await searchPlaces(query);
        if (this.state.query !== query) return;
        this.setState({
          searchPending: false,
          searchError: null,
          liveResults: {
            query,
            items: (items || []).map((r) => ({
              name: r.name || r.address,
              detail: r.postal ? r.address + " · " + r.postal : r.address,
              kind: "Address",
              ll: [r.lat, r.lng],
            })),
          },
        });
      } catch {
        // Live search is unreachable — fall back to the built-in place list,
        // labelled as such so it never reads as live data.
        if (this.state.query !== query) return;
        this.setState({ liveResults: null, searchPending: false, searchError: "Can't reach OneMap — check your connection" });
      }
    }, 350);
  };

  // Debounced OneMap search inside the add-commute sheet.
  scheduleAddSearch = () => {
    if (this._addSearchT) clearTimeout(this._addSearchT);
    const query = (this.state.addQuery || "").trim();
    if (query.length < 2) {
      this.setState({ addSearchResults: { items: [], pending: false, error: null, query } });
      return;
    }
    this.setState({ addSearchResults: { items: [], pending: true, error: null, query } });
    this._addSearchT = setTimeout(() => {
      searchPlaces(query)
        .then((items) => {
          if ((this.state.addQuery || "").trim() !== query) return;
          this.setState({
            addSearchResults: {
              query,
              pending: false,
              error: null,
              items: (items || []).map((r, i) => ({
                id: `om-${r.postal || i}-${r.lat}`,
                name: r.name || r.address,
                detail: r.postal ? `${r.address} · ${r.postal}` : r.address,
                kind: "Address",
                ll: [r.lat, r.lng],
              })),
            },
          });
        })
        .catch((err) => {
          if ((this.state.addQuery || "").trim() !== query) return;
          this.setState({ addSearchResults: { items: [], pending: false, error: String(err.message || err), query } });
        });
    }, 350);
  };

  // Real journey options for the picked destination and mode. No fallback:
  // a failure surfaces in the sheet rather than being papered over.
  loadTripOptions = () => {
    const { dest, tripMode } = this.state;
    if (!dest || !dest.ll) return;
    const request = (origin) => {
      const key = `${dest.name}|${tripMode}|${origin.join(",")}`;
      if (this.state.trips.key === key && this.state.trips.options.length) return Promise.resolve();

      this.setState({ trips: { key, options: [], pending: true, error: null } });
      return getTripOptions(origin, dest.ll, tripMode, dest.name)
      .then((options) => {
        if (this.state.dest !== dest || this.state.tripMode !== tripMode) return;
        this.setState({ trips: { key, options, pending: false, error: null }, tripRoute: 0 });
      })
      .catch((err) => {
        if (this.state.dest !== dest) return;
        this.setState({ trips: { key, options: [], pending: false, error: String(err.message || err) } });
      });
    };

    (this.state.userLoc ? Promise.resolve(this.state.userLoc) : this.requestCurrentLocation())
      .then(request)
      .catch((err) => {
        if (this.state.dest !== dest) return;
        this.setState({ trips: { key: null, options: [], pending: false, error: messageForError(err && err.code) } });
      });
  };

  // Live platform crowding, optionally for a forecast slot.
  loadCrowding = (at) => {
    this.setState((st) => ({ crowd: { ...st.crowd, pending: true, error: null } }));
    getCrowding(at)
      .then((data) => this.setState({ crowd: { ...data, pending: false, error: null } }))
      .catch((err) =>
        this.setState((st) => ({ crowd: { ...st.crowd, stations: [], pending: false, error: String(err.message || err) } }))
      );
  };

  // Live LTA DataMall train service alerts.
  loadFaults = () => {
    this.setState((st) => ({ faults: { ...st.faults, pending: true, error: null } }));
    getTrainServiceAlerts()
      .then((data) => {
        const segments = data && Array.isArray(data.AffectedSegments) ? data.AffectedSegments : [];
        const segmentItems = segments.map((seg) => ({
          line: seg.Line || "Rail",
          tag: "Delay",
          sev: "warn",
          time: "Now",
          title: `${seg.Line || "Line"} — ${seg.Direction || "service"} affected`,
          detail: [
            seg.StartStation && seg.EndStation ? `Between ${seg.StartStation} and ${seg.EndStation}.` : "",
            seg.Stations ? `Stations: ${seg.Stations}` : "",
          ].filter(Boolean).join(" "),
        }));
        const messageItems = data && Array.isArray(data.Message)
          ? data.Message.filter((message) => message && message.Content).map((message) => {
              const content = String(message.Content).trim();
              const separator = content.indexOf("-");
              const title = separator > 0 ? content.slice(separator + 1).split(". ")[0] : content;
              return {
                line: "LTA",
                tag: "Service update",
                sev: "warn",
                time: message.CreatedDate || "Today",
                title,
                detail: content,
              };
            })
          : [];
        const items = [...segmentItems, ...messageItems];
        this.setState({ faults: { items, pending: false, error: null } });
      })
      .catch((err) =>
        this.setState({ faults: { items: [], pending: false, error: String(err.message || err) } })
      );
  };

  // Resolves the stop a report is filed against from the real position.
  findNearestStop = () => {
    this.setState((st) => ({ stop: { ...st.stop, pending: true, error: null } }));
    getPosition()
      .then((fix) => {
        this.setState((st) => ({ userLoc: st.userLoc || fix.coords, userAccuracy: st.userAccuracy || fix.accuracy }));
        return getNearestStop(fix.coords[0], fix.coords[1]);
      })
      .then((data) => this.setState({ stop: { data, pending: false, error: null } }))
      .catch((err) =>
        this.setState({ stop: { data: null, pending: false, error: messageForError(err && err.code) || String(err.message || err) } })
      );
  };

  navSnaps = [152, 336, 620];
  navSnap(h) {
    return this.navSnaps.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a), this.navSnaps[0]);
  }
  startNavDrag = (e) => {
    const startY = e.clientY, startH = this.state.navSheetH == null ? 336 : this.state.navSheetH;
    this.setState({ navDragging: true });
    const move = (ev) => {
      const h = Math.max(148, Math.min(680, startH - (ev.clientY - startY)));
      this.setState({ navSheetH: h });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      this.setState((st) => ({ navDragging: false, navSheetH: this.navSnap(st.navSheetH == null ? 336 : st.navSheetH) }));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  cycleNavSheet = () => {
    const h = this.state.navSheetH == null ? 336 : this.state.navSheetH;
    const idx = this.navSnaps.indexOf(this.navSnap(h));
    this.setState({ navSheetH: this.navSnaps[(idx + 1) % this.navSnaps.length] });
  };

  introVals(s, sc) {
    const step = s.introStep || 0;
    const roles = s.introRoles || [];
    const has = (id) => roles.indexOf(id) >= 0;
    const ROLES = [
      { id: "commuter", label: "Daily commuter", sub: "Same trip most weekdays", icon: "train-front" },
      { id: "student", label: "Student", sub: "Campus trips, concession fares", icon: "graduation-cap" },
      { id: "wheelchair", label: "Wheelchair user", sub: "Lifts and level boarding only", icon: "accessibility" },
      { id: "pram", label: "Travelling with a pram", sub: "Avoid stairs and tight gantries", icon: "baby" },
      { id: "senior", label: "Senior", sub: "Longer buffers, a seat matters", icon: "heart-handshake" },
    ];
    const stepFree = has("wheelchair") || has("pram");
    const wantsSchool = has("student");
    const rolePill = (on) =>
      "display:flex;align-items:center;gap:12px;padding:14px 15px;border-radius:var(--radius-card);cursor:pointer;font:var(--font-body);transition:background .15s,border-color .15s;" +
      (on ? "background:var(--accent-soft);border:1px solid var(--accent);color:var(--text-strong);" : "background:var(--surface-card);border:1px solid var(--border-card);color:var(--text-strong);");
    const sug = (field, list) =>
      list.map((label) => ({
        label,
        pick: () => this.setState({ [field]: label }),
        style: "padding:8px 13px;border-radius:999px;cursor:pointer;white-space:nowrap;font:var(--weight-bold) 12px/1 var(--font-body);" +
          (s[field] === label ? "background:var(--accent);border:1px solid var(--accent);color:var(--text-on-accent);" : "background:var(--accent-soft);border:1px solid var(--border-card);color:var(--text-body);"),
      }));
    const places = [
      { key: "introHome", label: "Home", placeholder: "Block, street or MRT stop", icon: "house", sugg: ["Yishun", "Sengkang", "Bukit Batok"] },
      { key: "introWork", label: wantsSchool ? "Work or internship" : "Work", placeholder: "Office, building or area", icon: "briefcase", sugg: ["Raffles Place", "Changi Business Park", "Jurong East"] },
    ].concat(wantsSchool ? [{ key: "introSchool", label: "School or campus", placeholder: "Campus or faculty", icon: "graduation-cap", sugg: ["NTU", "NUS Kent Ridge", "SMU"] }] : []);
    const filled = places.filter((p) => (s[p.key] || "").trim()).length;
    const total = 4;
    const homeLabel = (s.introHome || "").trim() || "Yishun";
    const workLabel = (s.introWork || "").trim() || "Raffles Place";
    const summary = [
      { text: "Watching " + homeLabel + " → " + workLabel + ", with a leave-by alert 25 min ahead." },
      { text: stepFree
        ? "Step-free routing is on. Lifts, level boarding and wider gantries only — lift faults reroute you automatically."
        : has("senior")
        ? "Comfort routes come first, with longer transfer buffers and seat odds on every option."
        : "Fastest routes come first, with crowding shown before you board." },
      { text: wantsSchool && (s.introSchool || "").trim()
        ? "Campus trips to " + (s.introSchool || "").trim() + " are saved, including term-time weekday mornings."
        : "Crowding on your lines is checked every few minutes while you travel." },
      { text: "Reports you post at your stop earn points towards fare vouchers." },
    ];
    return {
      isIntro: sc === "intro",
      introS0: step === 0, introS1: step === 1, introS2: step === 2, introS3: step === 3,
      introCanBack: step > 0,
      introDots: [0, 1, 2, 3].map((idx) => ({
        style: { width: idx === step ? 18 : 6, height: 6, borderRadius: 999, background: idx <= step ? "var(--accent)" : "var(--sand-300)", transition: "width 220ms cubic-bezier(.2,.7,.3,1),background-color 220ms linear" },
      })),
      introPromises: [
        { icon: "bell", title: "Leave-by alerts", detail: "A nudge before your usual door-to-door time slips." },
        { icon: "users", title: "Crowding you can trust", detail: "Live counts from LTA plus reports from people at the stop." },
        { icon: "accessibility", title: "Routes that fit you", detail: "Step-free, fewest changes or least walking — your default, not an afterthought." },
      ],
      introRoles: ROLES.map((r) => ({
        ...r,
        style: rolePill(has(r.id)),
        iconStyle: "flex:none;width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;" + (has(r.id) ? "background:var(--accent);color:var(--text-on-accent);" : "background:var(--accent-soft);color:var(--text-accent);"),
        subStyle: "display:block;font:var(--type-caption);color:var(--text-muted);margin-top:3px",
        checkStyle: "flex:none;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;" + (has(r.id) ? "background:var(--accent);color:var(--text-on-accent);" : "background:transparent;color:transparent;"),
        toggle: () => this.setState({ introRoles: has(r.id) ? roles.filter((x) => x !== r.id) : roles.concat([r.id]) }),
      })),
      introPlaces: places.map((p) => ({
        label: p.label, placeholder: p.placeholder, icon: p.icon, value: s[p.key] || "",
        set: (v) => this.setState({ [p.key]: typeof v === "string" ? v : v && v.target ? v.target.value : "" }),
        suggestions: sug(p.key, p.sugg),
      })),
      introSummaryTitle: "Solvik is set up for " + (stepFree ? "step-free travel" : has("student") ? "student travel" : has("senior") ? "a calmer commute" : has("commuter") ? "your daily commute" : "your commute"),
      introSummary: summary,
      introCta: ["Set up in a minute", roles.length ? "Next · " + roles.length + " selected" : "Next", filled ? "Next · " + filled + " saved" : "Next", "Start using Solvik"][step],
      introNext: () => {
        if (step < total - 1) return this.setState({ introStep: step + 1 });
        this.setState({
          screen: "map", introStep: 0,
          plHome: (s.introHome || "").trim() || "Yishun",
          plWork: (s.introWork || "").trim() || "Raffles Place",
          plSchool: (s.introSchool || "").trim(),
          mode: stepFree ? "silver" : has("senior") ? "comfort" : "rush",
          tripMode: stepFree ? "step" : "fast",
        });
        if (typeof localStorage !== "undefined") localStorage.setItem(ONBOARDED_KEY, "1");
        this.flash(stepFree ? "Step-free routing on · watching " + homeLabel + " → " + workLabel : "Watching " + homeLabel + " → " + workLabel);
      },
      introBack: () => this.setState({ introStep: Math.max(0, step - 1) }),
      introSkip: () => {
        this.setState({ screen: "map", introStep: 0 });
        if (typeof localStorage !== "undefined") localStorage.setItem(ONBOARDED_KEY, "1");
        this.flash("Set your places any time in Plan");
      },
    };
  }

  go = (screen) => this.setState({ screen, rep: "pick", repType: null, sev: null });
  flash = (toast) => {
    this.setState({ toast });
    if (this.tt) clearTimeout(this.tt);
    this.tt = setTimeout(() => this.setState({ toast: null }), 2600);
  };
  lineStyle(label) {
    const L = [["NS", "#D42E12", "#fff"], ["EW", "#009645", "#fff"], ["NE", "#9900AA", "#fff"], ["CC", "#FA9E0D", "#201e1d"], ["DT", "#005EC4", "#fff"], ["TE", "#9D5B25", "#fff"]];
    const hit = L.find(([p]) => String(label).toUpperCase().indexOf(p) === 0);
    const [bg, fg] = hit ? [hit[1], hit[2]] : ["#201e1d", "#fff"];
    return { display: "inline-flex", alignItems: "center", borderRadius: "999px", padding: "5px 10px", font: "var(--weight-bold) 12px/1 var(--font-body)", letterSpacing: ".01em", background: bg, color: fg, whiteSpace: "nowrap" };
  }
  level(v) { return v < 0.45 ? "light" : v < 0.75 ? "moderate" : "busy"; }
  barsFor(l) { return [{ style: { width: "11px", height: "11px", borderRadius: "999px", background: CROWD[l], display: "block" } }]; }
  bars(v) { return this.barsFor(this.level(v)); }
  snaps(H) { return [190, Math.round(H * 0.55), Math.round(H - 104)]; }

  startStepsDrag(e) {
    const el = this.stepsEl;
    if (!el || e.button === 2) return;
    const startX = e.clientX, startLeft = el.scrollLeft;
    this.setState({ stepsDrag: true });
    const move = (ev) => {
      const d = startX - ev.clientX;
      el.scrollLeft = startLeft + d;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const w = Math.max(1, el.clientWidth + 10), page = Math.round(el.scrollLeft / w);
      this.userScrolled = Date.now();
      this.setState({ stepsDrag: false, navPage: page });
      el.scrollTo({ left: page * w, behavior: "smooth" });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    e.preventDefault();
  }

  lerpRoute(coords, f) {
    if (!coords || coords.length < 2) return coords && coords[0];
    const t = Math.max(0, Math.min(1, f)) * (coords.length - 1), idx = Math.min(coords.length - 2, Math.floor(t)), k = t - idx;
    return [coords[idx][0] + (coords[idx + 1][0] - coords[idx][0]) * k, coords[idx][1] + (coords[idx + 1][1] - coords[idx][1]) * k];
  }

  startSheetDrag(e) {
    const el = this.sheetEl, host = el && el.parentElement;
    if (!host) return;
    e.preventDefault();
    const H = host.getBoundingClientRect().height;
    const snaps = this.snaps(H), startY = e.clientY, startH = this.state.sheetH || snaps[1];
    let moved = false, cur = startH;
    this.setState({ sheetDrag: true });
    const move = (ev) => {
      const d = startY - ev.clientY;
      if (Math.abs(d) > 4) moved = true;
      cur = Math.max(150, Math.min(snaps[2], startH + d));
      this.setState({ sheetH: cur });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      let target;
      if (!moved) target = cur >= snaps[2] - 10 ? snaps[1] : snaps[2];
      else target = snaps.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a), snaps[0]);
      this.setState({ sheetH: target, sheetDrag: false });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  renderVals() {
    const s = this.state, sc = s.screen;

    const rTypes = [
      { id: "crowd", label: "Packed platform", sub: "Two trains to board", pts: 30 },
      { id: "esc", label: "Escalator or lift down", sub: "Out of service", pts: 25 },
      { id: "delay", label: "Train held", sub: "Waiting at the platform", pts: 30 },
      { id: "gantry", label: "Gantry queue", sub: "Backed up to the street", pts: 20 },
      { id: "bus", label: "Bus full", sub: "Drove past the stop", pts: 20 },
      { id: "aircon", label: "Comfort issue", sub: "Carriage too warm", pts: 15 },
    ].map((t) => {
      const on = s.repType === t.id;
      const icon = { crowd: "users", esc: "move-vertical", delay: "timer", gantry: "scan-line", bus: "bus", aircon: "thermometer" }[t.id];
      return {
        ...t, icon, pick: () => this.setState({ repType: t.id, rep: "confirm", sev: null }), tone: on ? "accent" : "plain",
        iconStyle: { width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: on ? "var(--accent)" : "var(--accent-soft)", color: on ? "var(--text-on-accent)" : "var(--text-accent)" },
        ptsStyle: { display: "inline-flex", alignItems: "center", gap: 4, alignSelf: "flex-start", font: "var(--weight-bold) 11px/1 var(--font-body)", color: "var(--text-accent)", background: on ? "var(--surface-card)" : "var(--accent-soft)", borderRadius: 999, padding: "6px 9px" },
      };
    });
    const chosen = rTypes.find((t) => t.id === s.repType) || rTypes[0];

    const SEV = {
      crowd: { q: "How packed is it", opts: ["Manageable · one train wait", "Getting busy · two to three trains", "Crush · holding at the gantry"] },
      esc: { q: "What is out", opts: ["One escalator stopped · stairs beside it", "Escalator out · long queue at the stairs", "Lift out · no step-free way up"] },
      delay: { q: "How long has it been held", opts: ["Under 5 min · doors still open", "5 to 15 min · no announcement yet", "Over 15 min · staff turning people away"] },
      gantry: { q: "How far does the queue reach", opts: ["A few people at the gates", "Queue inside the concourse", "Queue out to the street"] },
      bus: { q: "What happened at the stop", opts: ["Standing room only · squeezed on", "Full · only a few could board", "Drove past · nobody could board"] },
      aircon: { q: "What is uncomfortable", opts: ["Slightly warm · bearable", "No aircon · uncomfortable", "Unbearable · people moving carriage"] },
    };
    const sevSet = SEV[s.repType || "crowd"] || SEV.crowd;
    const severities = sevSet.opts.map((label, i) => ({ label, on: s.sev === i, pick: () => this.setState({ sev: i }) }));

    const vouchers = [
      { title: "$1 off at Kopitiam", sub: "400 points · 6 outlets nearby", cost: 400 },
      { title: "$5 EZ-Link top-up", sub: "1,800 points · instant", cost: 1800 },
      { title: "$3 FairPrice voucher", sub: "1,200 points", cost: 1200 },
      { title: "Off-peak fare rebate", sub: "3,000 points · LTA pilot", cost: 3000 },
    ].map((v, vi) => {
      const can = s.points >= v.cost;
      return {
        ...v, cta: can ? "Redeem" : "Locked", variant: can ? "primary" : "secondary", disabled: !can, locked: !can,
        icon: ["coffee", "credit-card", "shopping-basket", "ticket"][vi] || "gift",
        gap: (v.cost - s.points).toLocaleString(),
        cardStyle: { background: "var(--surface-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-card)", padding: "14px 15px", opacity: can ? 1 : 0.78 },
        iconStyle: { flex: "none", width: 34, height: 34, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: can ? "var(--accent-soft)" : "var(--sand-100)", color: can ? "var(--text-accent)" : "var(--text-muted)" },
        barStyle: { width: Math.round(Math.min(1, s.points / v.cost) * 100) + "%", height: "100%", background: "var(--accent)", borderRadius: 999 },
        redeem: () => { if (can) { this.setState({ points: s.points - v.cost }); this.flash("Redeemed · " + v.title); } },
      };
    });

    const ORIGIN = this.currentOrigin();
    const q = s.query.trim().toLowerCase();
    // Only ever live OneMap results.
    const resultSource = s.liveResults && s.liveResults.query === s.query ? s.liveResults.items : [];
    const results = resultSource.slice(0, 6).map((p) => ({
      ...p,
      // Clearing the query here is what stops the panel reopening when the
      // user comes back via "Change".
      pick: () => this.setState({ dest: p, tripRoute: 0, query: "", liveResults: null, searchOpen: false, searchPending: false }),
    }));

    const dest = s.dest;
    const trips = s.trips || { options: [], pending: false, error: null };
    // Cards come straight from OneMap itineraries, enriched with LTA crowding.
    const tripOptions = (trips.options || []).map((o, i) => ({
      ...o,
      pick: () => this.setState({ tripRoute: i }),
      tone: s.tripRoute === i ? "accent" : "hairline",
      start: (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        // Snapshot the route: re-planning while under way must not pull the
        // steps out from under the screen showing them.
        this.setState({ tripRoute: i, navRoute: i, navTrip: o, screen: "nav", navStart: Date.now() });
      },
      legs: (o.legs || []).map((label) => ({ label, style: this.lineStyle(label) })),
      bars: o.crowdLevel ? this.barsFor(o.crowdLevel) : [],
      crowd: o.crowdLevel ? WORD[o.crowdLevel] : "Crowding unknown",
      fare: o.fare || "Fare unknown",
    }));

    const destShort = dest ? dest.name.split(" (")[0].replace(/\s+$/, "") : "your destination";
    const navOpt = s.navTrip || tripOptions[s.navRoute != null ? s.navRoute : s.tripRoute] || tripOptions[0];
    const navArr = (navOpt && navOpt.steps) || [];
    const navGeometry = (navOpt && navOpt.geometry) || [];
    const navTotal = navArr.reduce((a, b) => a + (b.secs || 0), 0) || 1;

    // Progress is measured against the real clock, and against the real
    // position when the device is sharing one.
    const elapsedSecs = s.navStart ? ((s.tick || Date.now()) - s.navStart) / 1000 : 0;
    const alongRoute = s.userLoc && navGeometry.length > 1 ? fractionAlong(navGeometry, s.userLoc) : null;
    const navFrac = Math.max(0, Math.min(1, alongRoute != null ? alongRoute : elapsedSecs / navTotal));
    const navElapsed = navFrac * navTotal;

    let acc = 0, navIdx = 0, stepRem = 0;
    for (let idx = 0; idx < navArr.length; idx++) {
      if (navElapsed < acc + (navArr[idx].secs || 0) || idx === navArr.length - 1) {
        navIdx = idx;
        stepRem = acc + (navArr[idx].secs || 0) - navElapsed;
        break;
      }
      acc += navArr[idx].secs || 0;
    }
    const arrived = navArr.length > 0 && navElapsed >= navTotal - 1;
    this._navIdx = navIdx;
    const fmtS = (x) => (x >= 60 ? Math.ceil(x / 60) + " min" : Math.max(0, Math.ceil(x)) + " s");
    const curStep = navArr[navIdx] || {};
    const stepProg = curStep.secs ? Math.max(0, Math.min(1, 1 - stepRem / curStep.secs)) : 0;
    const curStops = curStep.stops && curStep.stops.length ? curStep.stops : null;
    const passed = curStops ? Math.min(curStops.length - 1, Math.floor(stepProg * curStops.length)) : 0;
    const stopsLeft = curStops ? curStops.length - passed : 0;
    const liveStopLine = curStops
      ? "Next: " + curStops[passed] + " · " + stopsLeft + " stop" + (stopsLeft === 1 ? "" : "s") + " to " + curStep.alight
      : curStep.detail;

    const nav = {
      navIcon: arrived ? "circle-check" : curStep.icon || "navigation",
      navTitle: arrived ? "You have arrived" : curStep.title || "Getting your next step",
      navDetail: arrived ? destShort : liveStopLine,
      navCountdown: arrived ? "Done" : fmtS(stepRem),
      navStepLabel: arrived ? "Trip complete" : navArr.length ? "Step " + (navIdx + 1) + " of " + navArr.length : "Preparing trip",
      navEta: navOpt ? navOpt.eta : "",
      navRemainLabel: arrived ? "Arrived · " + destShort : Math.max(1, Math.ceil((navTotal - navElapsed) / 60)) + " min left · " + destShort,
      navCoord: s.userLoc || this.lerpRoute(navGeometry, navFrac) || ORIGIN,
      navProgressStyle: { width: Math.round(navFrac * 100) + "%", height: "100%", background: "var(--accent)", borderRadius: 999, transition: "width 1s linear" },
      setStepsRef: (el) => { this.stepsEl = el; },
      stepsPagerStyle: {
        flex: "1 1 auto", width: "100%", minWidth: 0, maxWidth: "100%", minHeight: 0, display: s.navSheetH != null && s.navSheetH < 240 ? "none" : "flex", alignItems: "stretch", gap: 10, overflowX: "auto", overflowY: "hidden",
        scrollSnapType: s.stepsDrag ? "none" : "x mandatory", scrollbarWidth: "none",
        cursor: s.stepsDrag ? "grabbing" : "grab", touchAction: "pan-x", userSelect: "none",
      },
      stepsDragStart: (e) => this.startStepsDrag(e),
      onStepsScroll: (e) => {
        const el = e.currentTarget, p = Math.round(el.scrollLeft / Math.max(1, el.clientWidth + 10));
        this.userScrolled = Date.now();
        if (p !== s.navPage) this.setState({ navPage: p });
      },
      navDots: navArr.map((st, idx) => ({
        style: { width: idx === s.navPage ? 18 : 6, height: 6, borderRadius: 999, background: idx === s.navPage ? "var(--accent)" : idx < navIdx ? "var(--sand-400)" : "var(--sand-300)", transition: "width var(--dur-base) var(--ease-out),background-color var(--dur-base) var(--ease-standard)" },
      })),
      navList: navArr.map((st, idx) => {
        const done = idx < navIdx || arrived, cur = idx === navIdx && !arrived;
        const nStops = (st.stops || []).length;
        const ROW = 32, span = Math.max(0, (nStops - 1) * ROW);
        const prog = cur ? stepProg : done ? 1 : 0;
        const stopList = (st.stops || []).map((name, j) => {
          const sDone = done || (cur && j < passed), sNext = cur && j === passed;
          return {
            name,
            rowStyle: { display: "flex", alignItems: "center", gap: 10, height: ROW, position: "relative", zIndex: 1 },
            style: { font: (sNext ? "var(--weight-bold)" : "var(--weight-regular)") + " 12px/1.2 var(--font-body)", color: sNext ? "var(--text-accent)" : sDone ? "var(--text-subtle)" : "var(--text-body)", textWrap: "pretty" },
            dotStyle: { width: sNext ? 11 : 9, height: sNext ? 11 : 9, borderRadius: 999, background: sDone ? "var(--accent)" : "var(--surface-card)", border: sDone ? "2px solid var(--accent)" : "2px solid var(--sand-400)", boxShadow: sNext ? "0 0 0 3px var(--accent-soft)" : "none" },
          };
        });
        return {
          title: st.title, detail: cur && st.stops ? liveStopLine : st.detail, dur: fmtS(st.secs), icon: st.icon,
          stopList, hasStops: nStops > 0, showVehicle: cur && nStops > 0,
          laneWrapStyle: { position: "relative", marginTop: 4, paddingLeft: 0 },
          laneStyle: { position: "absolute", left: 11, top: ROW / 2, height: span, width: 4, background: "var(--sand-200)", borderRadius: 999 },
          laneFillStyle: { position: "absolute", left: 11, top: ROW / 2, height: Math.round(span * prog), width: 4, background: "var(--accent)", borderRadius: 999, transition: "height 1s linear" },
          vehicleStyle: { position: "absolute", left: 0, top: Math.round(ROW / 2 + span * prog - 13), width: 26, height: 26, borderRadius: 999, background: "var(--accent)", color: "var(--text-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(32,30,29,.3)", transition: "top 1s linear", zIndex: 2 },
          state: done ? "Done" : cur ? "Now" : "Next",
          cardStyle: { flex: "0 0 100%", minWidth: 0, boxSizing: "border-box", scrollSnapAlign: "start", background: cur ? "var(--accent-soft)" : "var(--surface-card)", border: "1px solid " + (cur ? "transparent" : "var(--border-card)"), borderRadius: "var(--radius-card)", padding: "14px 15px", display: "flex", flexDirection: "column", gap: 7, overflowY: "auto", overscrollBehavior: "contain", opacity: done ? 0.62 : 1 },
          iconWrapStyle: { flex: "none", width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: cur ? "var(--accent)" : "var(--sand-100)", color: cur ? "var(--text-on-accent)" : "var(--text-body)" },
          chipStyle: { font: "var(--weight-bold) 10px/1 var(--font-body)", letterSpacing: ".06em", textTransform: "uppercase", color: cur ? "var(--text-accent)" : "var(--text-muted)", background: cur ? "var(--surface-card)" : "var(--sand-100)", borderRadius: 999, padding: "5px 9px" },
          titleStyle: { font: "var(--weight-heavy) var(--size-body)/1.3 var(--font-body)", color: "var(--text-strong)", textWrap: "pretty" },
        };
      }),
    };

    const tabDefs = [{ id: "map", label: "Map" }, { id: "plan", label: "Plan" }, { id: "report", label: "Report" }, { id: "rewards", label: "Points" }];
    const chipDefs = [["intro", "Intro"], ["map", "Map"], ["plan", "Plan"], ["report", "Report"], ["rewards", "Points"]];

    return {
      chips: chipDefs.map(([id, label]) => ({
        label, go: () => this.go(id),
        style: { cursor: "pointer", borderRadius: "999px", padding: "8px 14px", font: "var(--weight-semibold) 13px/1 var(--font-body)", border: "1px solid " + (sc === id ? "var(--accent)" : "var(--border-hairline)"), background: sc === id ? "var(--accent)" : "var(--surface-card)", color: sc === id ? "var(--text-on-accent)" : "var(--text-muted)", transition: "background 150ms cubic-bezier(.2,.7,.3,1)" },
      })),
      ...this.introVals(s, sc),
      isReport: sc === "report", isRewards: sc === "rewards", isPlan: sc === "plan",
      showStatus: ["report", "rewards", "plan"].indexOf(sc) >= 0,
      showTabs: ["map", "plan", "report", "rewards"].indexOf(sc) >= 0 && !(sc === "map" && !!s.dest),
      isMap: sc === "map", mapSearch: !s.dest, mapRoute: !!s.dest,
      // The panel stays shut until there is a real query to answer — focusing
      // the field no longer surfaces the built-in place list.
      showResults: !s.dest && q.length >= 2,
      openSearch: () => this.setState({ searchOpen: true }),
      closeSearch: () => { if (this.bt) clearTimeout(this.bt); this.bt = setTimeout(() => this.setState({ searchOpen: false }), 160); },
      dismissSearch: () => this.setState({ query: "", searchOpen: false, liveResults: null, searchPending: false }),
      query: s.query,
      setQuery: (val) => this.setState({ query: val }),
      clearQuery: () => this.setState({ query: "", liveResults: null, searchPending: false }),
      results,
      resultsLabel: "Results for “" + s.query.trim() + "”",
      searchPending: !!s.searchPending,
      searchEmpty: !s.searchPending && !s.searchError && results.length === 0,
      searchError: s.searchError || null,
      searchFooter: "Results from OneMap · Singapore Land Authority",
      destName: dest ? dest.name : "", destDetail: dest ? dest.detail : "",
      destCoord: dest ? dest.ll : null, originCoord: ORIGIN, mapCenter: ORIGIN,
      routeCoords: (tripOptions[s.tripRoute] || tripOptions[0] || {}).geometry || [],
      userAccuracy: s.userLoc ? s.userAccuracy : null,
      recenterToken: s.recenterToken || 0,
      locating: !!s.locating,
      hasFix: !!s.userLoc,
      locateMe: this.locateMe,
      // Sits clear of whichever bottom overlay is currently showing.
      locateBottom: dest ? (s.sheetH || 430) + 12 : s.fcPin ? 250 : s.pin ? 210 : (s.crowdOn !== false && !s.searchOpen && !q) ? 170 : 96,
      backToSearch: () => this.setState({ dest: null }),
      pinCoord: s.pin ? s.pin.ll : null,
      hasPin: !!s.pin && !dest && !s.fcPin,
      showMapAttrib: !dest && !s.pin && !s.fcPin && s.crowdOn === false,
      showPinHint: !s.pin && !dest && !s.searchOpen && !q && !s.fcPin && s.crowdOn === false,
      pinName: s.pin ? s.pin.name : "",
      pinDetail: s.pin ? s.pin.detail : "",
      dropPin: (ll) => {
        if (this.state.dest) return;
        this.setState({
          pin: { ll, name: "Dropped pin", detail: ll[0].toFixed(5) + ", " + ll[1].toFixed(5) },
        });
      },
      clearPin: () => this.setState({ pin: null }),
      pinDirections: () => {
        const p = this.state.pin;
        if (!p) return;
        this.setState({ dest: { name: p.name, detail: p.detail, ll: p.ll, kind: "Pin" }, tripRoute: 0, pin: null, sheetH: 430 });
      },
      pinSearch: () => {
        const p = this.state.pin;
        if (!p) return;
        this.setState({ query: "", searchOpen: true, pin: null });
        this.flash("Showing places near the pin");
      },
      setSheetRef: (el) => { this.sheetEl = el; },
      sheetWrapStyle: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 15, display: "flex", height: (s.sheetH || 430) + "px", transition: s.sheetDrag ? "none" : "height var(--dur-base) var(--ease-out)" },
      sheetStyle: { flex: 1, minHeight: 0, width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", padding: "0 16px" },
      sheetGrabStyle: { flex: "none", padding: "10px 0 12px", cursor: s.sheetDrag ? "grabbing" : "grab", touchAction: "none", userSelect: "none" },
      sheetDragStart: (e) => this.startSheetDrag(e),
      tripModeTiles: [
        { id: "fast", label: "Fastest" },
        { id: "budget", label: "Cheapest" },
        { id: "quiet", label: "Less crowded" },
        { id: "step", label: "Step-free" },
        { id: "few", label: "Fewest changes" },
        { id: "walk", label: "Least walking" },
        { id: "bike", label: "Bike + rail" },
      ].map((m) => {
        const on = s.tripMode === m.id;
        return {
          ...m, pick: () => this.setState({ tripMode: m.id, tripRoute: 0 }),
          tileStyle: "flex:none;padding:10px 14px;border-radius:999px;cursor:pointer;white-space:nowrap;font:var(--weight-bold) 13px/1 var(--font-body);letter-spacing:-.005em;transition:background .15s,color .15s;" +
            (on ? "background:var(--accent);border:1px solid var(--accent);color:var(--text-on-accent);" : "background:var(--accent-soft);border:1px solid var(--border-card);color:var(--text-body);"),
        };
      }),
      tripMode: s.tripMode, setTripMode: (id) => this.setState({ tripMode: id, tripRoute: 0 }),
      tripModeBlurb: {
        fast: "Ranked by total journey time from OneMap.",
        budget: "Ranked by the fare OneMap returns, bus-only options included.",
        quiet: "Ranked by live platform crowding and bus loading from LTA.",
        step: "Prefers wheelchair-accessible buses and shorter walks. Lift outages are not guaranteed to be reflected.",
        few: "Ranked by number of transfers.",
        walk: "Ranked by time on foot, with a shorter maximum walking distance.",
        bike: "A cycling route end to end, from OneMap's cycling network.",
      }[s.tripMode],
      tripOptions,
      tripsPending: !!trips.pending,
      tripsError: trips.error || null,
      // Only after a request has actually resolved — the initial state is not "empty".
      tripsEmpty: !!trips.key && !trips.pending && !trips.error && tripOptions.length === 0,
      retryTrips: () => { this.setState({ trips: { key: null, options: [], pending: false, error: null } }, this.loadTripOptions); },
      isNav: sc === "nav",
      endTrip: () => { this.setState({ screen: "map", navTrip: null }); this.flash("Trip ended"); },
      goReport: () => this.setState({ navRepOpen: true, nrType: null, nrSev: null }),
      ...nav,
      headerTitle: { map: "Map", report: "Report", rewards: "Points", plan: "Today" }[sc] || "Solvik",
      headerSub: {
        map: "OneMap · Singapore Land Authority",
        report: s.stop.data ? `${s.stop.data.name} · reports stay live 30 min` : "Reports stay live 30 min",
        rewards: "Sample rewards data",
        plan: (() => {
          const n = (s.savedList || []).length;
          const today = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
          return `${today} · ${n} watched commute${n === 1 ? "" : "s"}`;
        })(),
      }[sc] || "",
      toast: s.toast,
      tabItems: tabDefs, tab: sc, setTab: (id) => this.go(id),
      tabPill: {
        position: "absolute", top: 7, bottom: 7, left: 7, width: "calc((100% - 14px) / 4)",
        transform: "translateX(" + Math.max(0, tabDefs.findIndex((t) => t.id === sc)) * 100 + "%)",
        background: "var(--accent-soft)", borderRadius: "var(--radius-pill)", transition: "transform var(--dur-base) var(--ease-out)",
      },
      navTabs: tabDefs.map((t) => {
        const on = t.id === sc, hov = s.hoverTab === t.id, pressed = s.pressTab === t.id;
        return {
          ...t, go: () => this.go(t.id),
          enter: () => this.setState({ hoverTab: t.id }),
          leave: () => this.setState({ hoverTab: null, pressTab: null }),
          down: () => this.setState({ pressTab: t.id }),
          up: () => this.setState({ pressTab: null }),
          icon: { map: "map", plan: "calendar-days", report: "megaphone", rewards: "award" }[t.id],
          dot: t.id === "map" || (t.id === "rewards" && s.points > 2000),
          dotStyle: { position: "absolute", top: -2, right: -4, width: 7, height: 7, borderRadius: 999, background: t.id === "map" ? "var(--crowd-busy)" : "var(--accent)", border: "1.5px solid var(--surface-card)", animation: t.id === "map" ? "sv-ping 1.8s var(--ease-standard) infinite" : "none" },
          style: {
            position: "relative", zIndex: 1, height: 54, border: "none", background: "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            color: on ? "var(--green-900)" : hov ? "var(--text-strong)" : "var(--text-muted)", cursor: "pointer",
            transform: pressed ? "scale(.92)" : hov && !on ? "translateY(-2px)" : "none",
            transition: "color var(--dur-base) var(--ease-standard),transform var(--dur-fast) var(--ease-out)",
            WebkitTapHighlightColor: "transparent",
          },
          iconStyle: { position: "relative", display: "inline-flex", transform: on ? "translateY(-1px) scale(1.12)" : "none", transition: "transform var(--dur-base) var(--ease-out)" },
          labelStyle: { font: (on ? "var(--weight-bold)" : "var(--weight-regular)") + " 11px/1 var(--font-body)", letterSpacing: ".01em", opacity: on || hov ? 1 : 0.82, transition: "opacity var(--dur-base) var(--ease-standard)" },
        };
      }),
      goRewards: () => this.go("rewards"),
      ...this.forecastVals(s),
      reportPick: s.rep === "pick", reportConfirm: s.rep === "confirm", reportDone: s.rep === "done",
      reportTypes: rTypes, chosenLabel: chosen.label, chosenPts: chosen.pts, severities, severityQ: sevSet.q,
      navSheetStyle: {
        position: "absolute", left: 0, right: 0, bottom: 0, height: s.navSheetH == null ? 336 : s.navSheetH,
        background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)",
        padding: "10px 16px 16px", display: "flex", flexDirection: "column", gap: 11, boxSizing: "border-box", overflow: "hidden",
        transition: s.navDragging ? "none" : "height 260ms cubic-bezier(.2,.7,.3,1)",
      },
      navGrabStyle: { flex: "none", padding: "6px 0 4px", cursor: s.navDragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none" },
      navDotsWrapStyle: { flex: "none", display: s.navSheetH != null && s.navSheetH < 240 ? "none" : "flex", justifyContent: "center", alignItems: "center", gap: 6 },
      navSheetDrag: this.startNavDrag,
      navSheetCycle: this.cycleNavSheet,
      navRepOpen: !!s.navRepOpen,
      navRepPick: !!s.navRepOpen && !s.nrType,
      navRepForm: !!s.navRepOpen && !!s.nrType,
      closeNavRep: () => { if (s.nrPhoto) URL.revokeObjectURL(s.nrPhoto); this.setState({ navRepOpen: false, nrType: null, nrSev: null, nrPhoto: null, nrPhotoName: null }); },
      navRepBack: () => { if (s.nrPhoto) URL.revokeObjectURL(s.nrPhoto); this.setState({ nrType: null, nrSev: null, nrPhoto: null, nrPhotoName: null }); },
      navRepTypes: rTypes.map((t) => ({
        label: t.label, sub: t.sub, pts: t.pts, icon: t.icon,
        pick: () => this.setState({ nrType: t.id, nrSev: null }),
        style: "display:flex;flex-direction:column;gap:6px;text-align:left;padding:12px 13px;border-radius:18px;cursor:pointer;background:var(--surface-card);border:1px solid var(--border-card);font:var(--font-body)",
      })),
      navRepTitle: s.nrType ? (rTypes.find((t) => t.id === s.nrType) || {}).label : "What is happening here",
      navRepSevQ: (SEV[s.nrType] || SEV.crowd).q,
      navRepSevs: (SEV[s.nrType] || SEV.crowd).opts.map((label, i) => ({
        label, pick: () => this.setState({ nrSev: i }),
        style: "width:100%;text-align:left;padding:12px 14px;border-radius:999px;cursor:pointer;font:var(--weight-bold) 13px/1.3 var(--font-body);" +
          (s.nrSev === i ? "background:var(--accent);border:1px solid var(--accent);color:var(--text-on-accent);" : "background:var(--accent-soft);border:1px solid var(--border-card);color:var(--text-body);"),
      })),
      navRepNoPhoto: !s.nrPhoto, navRepHasPhoto: !!s.nrPhoto,
      navRepPhotoName: s.nrPhotoName || "",
      navRepThumb: s.nrPhoto ? <img src={s.nrPhoto} alt="Report photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null,
      onNavRepPhoto: (e) => {
        const f = e && e.target && e.target.files && e.target.files[0];
        if (!f) return;
        if (s.nrPhoto) URL.revokeObjectURL(s.nrPhoto);
        this.setState({ nrPhoto: URL.createObjectURL(f), nrPhotoName: f.name + " · just now" });
      },
      navRepCta: !s.nrPhoto ? "Add a photo to post" : "Post · " + (rTypes.find((t) => t.id === s.nrType) || { pts: 0 }).pts + " points",
      navRepPost: () => {
        if (!s.nrPhoto) return;
        const t = rTypes.find((x) => x.id === s.nrType) || { pts: 0, label: "Report" };
        URL.revokeObjectURL(s.nrPhoto);
        this.setState({ navRepOpen: false, nrType: null, nrSev: null, nrPhoto: null, nrPhotoName: null, points: s.points + t.pts });
        this.flash(t.label + " posted · +" + t.pts + " points");
      },
      locEyebrow: s.stop.data ? "Live at your stop" : s.stop.error ? "No stop found" : "Finding your stop",
      locStopName: s.stop.data ? s.stop.data.name : s.stop.error ? "Location unavailable" : "Locating…",
      locDetail: s.stop.data
        ? `Stop ${s.stop.data.code} · ${Math.round(s.stop.data.distanceM)} m away · reports stay live 30 min`
        : s.stop.error || "Using your location to pick the stop you can report on.",
      locRecheckLabel: s.stop.pending ? "Locating" : "Recheck",
      locRecheck: () => this.findNearestStop(),
      reportStopReady: !!s.stop.data,
      hasPhoto: !!s.photoUrl, noPhoto: !s.photoUrl,
      photoName: s.photoName || "",
      photoThumb: s.photoUrl ? <img src={s.photoUrl} alt="Report photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null,
      reportCta: s.photoUrl ? "Post report · " + chosen.pts + " points" : "Add a photo to post",
      onPhoto: (e) => {
        const f = e && e.target && e.target.files && e.target.files[0];
        if (!f) return;
        if (s.photoUrl) URL.revokeObjectURL(s.photoUrl);
        this.setState({ photoUrl: URL.createObjectURL(f), photoName: f.name + " · just now" });
        this.flash("Photo attached · faces blurred");
      },
      clearPhoto: () => { if (s.photoUrl) URL.revokeObjectURL(s.photoUrl); this.setState({ photoUrl: null, photoName: null }); },
      backToPick: () => { if (s.photoUrl) URL.revokeObjectURL(s.photoUrl); this.setState({ rep: "pick", repType: null, sev: null, photoUrl: null, photoName: null }); },
      submitReport: () => { if (!s.photoUrl) return; this.setState({ rep: "done", points: s.points + chosen.pts, photoUrl: null, photoName: null }); },
      recentReports: [
        { c: CROWD.busy, text: "Packed platform · Bishan", ago: "2 min", votes: 14 },
        { c: CROWD.moderate, text: "Escalator down · Exit C", ago: "11 min", votes: 6 },
        { c: CROWD.light, text: "Bus 969 arriving light", ago: "14 min", votes: 3 },
      ].map((r) => ({
        ...r,
        dotStyle: { flex: "none", width: 10, height: 10, borderRadius: 999, background: r.c, boxShadow: "0 0 0 4px color-mix(in oklch, " + r.c + " 18%, transparent)" },
        confirm: () => { this.setState({ points: s.points + 5 }); this.flash("Confirmed · +5 points"); },
      })),
      points: s.points.toLocaleString(), vouchers,
      toGold: Math.max(0, 3100 - s.points).toLocaleString(),
      tierBarStyle: { width: Math.round(Math.max(0, Math.min(1, (s.points - 1000) / 2100)) * 100) + "%", height: "100%", background: "var(--crowd-light)", borderRadius: 999, transition: "width var(--dur-slow) var(--ease-out)" },
      pointStats: [
        { icon: "megaphone", value: "18", label: "Reports this month" },
        { icon: "badge-check", value: "94%", label: "Verified by others" },
        { icon: "users", value: "2.1k", label: "Commuters helped" },
      ],
      ...this.addCommuteVals(s),
    };
  }
}
