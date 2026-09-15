import { Component } from "react";
import { searchPlaces, getPublicTransportRoute } from "../api/onemap";
import { getTrainServiceAlerts } from "../api/lta";
import { decodePolyline } from "../lib/polyline";

const ONBOARDED_KEY = "solvik:onboarded";

// Ported from the Onward.dc.html prototype's embedded view-model script,
// almost verbatim. Every screen's render() calls `this.renderVals()` and
// reads off the same keys the prototype's `{{ }}` template bindings used, so
// this file stays the single source of truth for what each screen shows and
// how it behaves — only the render/JSX layer changed medium.
export const CROWD = { light: "var(--crowd-light)", moderate: "var(--crowd-moderate)", busy: "var(--crowd-busy)" };
export const WORD = { light: "Light", moderate: "Moderate", busy: "Busy" };

export class AppLogic extends Component {
  state = {
    savedList: [
      { from: "home", to: "work", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mins: 462, mode: "Comfort" },
      { from: "work", to: "home", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mins: 1100, mode: "Comfort" },
    ],
    addEdit: null, placesOpen: false, plHome: "Yishun", plWork: "Raffles Place", plSchool: "",
    addOpen: false, addFrom: "home", addTo: "work", addDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    addMode: "Comfort", addMins: 462, commutes: [], fcSlot: 0, fcPin: null, fcAlerts: false, fcWatch: [],
    hoverTab: null, pressTab: null, sheetH: 430, sheetDrag: false, navRoute: null, navStart: null,
    navPage: 0, stepsDrag: false, pin: null,
    screen: typeof localStorage !== "undefined" && localStorage.getItem(ONBOARDED_KEY) ? "map" : "intro",
    mode: "comfort", route: 0, fc: 2,
    filter: "all", rep: "pick", repType: null, sev: 1, cal: "off", points: 2480, toast: null, tick: 0,
    query: "", dest: null, searchOpen: false, tripMode: "fast", tripRoute: 0,
  };

  addCommuteVals(s) {
    const PLACES = [
      { id: "home", label: "Home", place: s.plHome || "Yishun", mins: 47 },
      { id: "work", label: "Work", place: s.plWork || "Raffles Place", mins: 44 },
      { id: "bishan", label: "Bishan", place: "Bishan", mins: 26 },
      { id: "ntu", label: "NTU", place: "Jurong West", mins: 62 },
      { id: "clinic", label: "Polyclinic", place: "Ang Mo Kio", mins: 22 },
      { id: "changi", label: "Airport", place: "Changi T3", mins: 58 },
    ].concat(s.addExtra || []);
    const DIRECTORY = [
      { id: "d-ttsh", label: "Tan Tock Seng Hospital", place: "Novena", detail: "11 Jalan Tan Tock Seng · 308433", kind: "Address", mins: 38 },
      { id: "d-jem", label: "Jem", place: "Jurong East", detail: "50 Jurong Gateway Rd · 608549", kind: "Mall", mins: 54 },
      { id: "d-amk-hub", label: "AMK Hub", place: "Ang Mo Kio", detail: "53 Ang Mo Kio Ave 3 · 569933", kind: "Mall", mins: 21 },
      { id: "d-nus", label: "National University of Singapore", place: "Kent Ridge", detail: "21 Lower Kent Ridge Rd · 119077", kind: "Campus", mins: 57 },
      { id: "d-woodlands", label: "Woodlands Interchange", place: "Woodlands", detail: "30 Woodlands Ave 2 · 738343", kind: "Bus stop", mins: 19 },
      { id: "d-sgh", label: "Singapore General Hospital", place: "Outram", detail: "1 Hospital Cres · 169608", kind: "Address", mins: 49 },
      { id: "d-tampines", label: "Tampines MRT", place: "Tampines", detail: "20 Tampines Central 1 · 529538", kind: "MRT", mins: 52 },
      { id: "d-marina", label: "Marina Bay Financial Centre", place: "Marina Bay", detail: "8 Marina Blvd · 018981", kind: "Office", mins: 46 },
      { id: "d-sengkang", label: "Sengkang Riverside", place: "Sengkang", detail: "Anchorvale St · 544644", kind: "Area", mins: 31 },
      { id: "d-changi-biz", label: "Changi Business Park", place: "Expo", detail: "1 Changi Business Park Ave 1 · 486036", kind: "Office", mins: 51 },
    ];
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const from = s.addFrom || "home", to = s.addTo || "work";
    const days = s.addDays || ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const mode = s.addMode || "Comfort";
    const mins = s.addMins == null ? 462 : s.addMins;
    const fromP = PLACES.find((p) => p.id === from) || PLACES[0];
    const toP = PLACES.find((p) => p.id === to) || PLACES[1];
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
    const aq = (s.addQuery || "").trim().toLowerCase();
    const aResults = (aq ? DIRECTORY.filter((p) => (p.label + " " + p.place + " " + p.detail).toLowerCase().indexOf(aq) >= 0) : DIRECTORY).slice(0, 7);
    const invalid = from === to || days.length === 0;
    const name = fromP.label + " → " + toP.label;
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
      addNoResults: !!aq && aResults.length === 0,
      addResults: aResults.map((p) => ({
        label: p.label, detail: p.detail, kind: p.kind,
        pick: () => {
          const extra = (s.addExtra || []).filter((x) => x.id !== p.id).concat([{ id: p.id, label: p.label, place: p.place, mins: p.mins }]).slice(-4);
          const key = s.addSearchFor === "to" ? "addTo" : "addFrom";
          this.setState({ addExtra: extra, [key]: p.id, addSearchFor: null, addQuery: "" });
        },
      })),
      addTime: clock(mins),
      addArrive: invalid ? "Pick two different places and at least one day." : "Arrive about " + clock(mins + toP.mins) + " · " + toP.mins + " min door to door",
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
        const f = PLACES.find((p) => p.id === c.from) || PLACES[0];
        const t = PLACES.find((p) => p.id === c.to) || PLACES[1];
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
        const nowMins = 7 * 60 + 21;
        const next = list.slice().sort((a, b) => {
          const da = (a.mins - nowMins + 1440) % 1440, db = (b.mins - nowMins + 1440) % 1440;
          return da - db;
        })[0];
        if (!next) return { planHasNext: false, planNextName: "", planNextLeave: "", planNextIn: "", planNextRoute: "", planNextNote: "", planNextCrowd: "", startNext: () => {}, watchNext: () => {} };
        const f = PLACES.find((p) => p.id === next.from) || PLACES[0];
        const t = PLACES.find((p) => p.id === next.to) || PLACES[1];
        const inMins = (next.mins - nowMins + 1440) % 1440;
        return {
          planHasNext: true,
          planNextName: f.label + " → " + t.label,
          planNextLeave: clock(next.mins),
          planNextIn: inMins < 60 ? "leave in " + inMins + " min" : "leave in " + Math.floor(inMins / 60) + " h " + (inMins % 60) + " min",
          planNextRoute: f.place + " → " + t.place,
          planNextNote: "Arrive about " + clock(next.mins + t.mins) + " · " + t.mins + " min door to door · " + next.mode.toLowerCase() + " routes",
          planNextCrowd: inMins < 40 ? "Filling now" : "Light now",
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
    const SLOTS = [
      { label: "Now", clock: "07:21", peak: 0.92 },
      { label: "08:00", clock: "08:00", peak: 1 },
      { label: "09:00", clock: "09:00", peak: 0.74 },
      { label: "12:00", clock: "12:00", peak: 0.4 },
      { label: "17:30", clock: "17:30", peak: 0.86 },
      { label: "19:00", clock: "19:00", peak: 0.58 },
    ];
    const i = Math.min(s.fcSlot || 0, SLOTS.length - 1);
    const slot = SLOTS[i];
    const AREAS = [
      { id: "city", name: "City Hall / Raffles Place", ll: [1.293, 103.852], radius: 1500, base: 1, detail: "NSL + EWL interchange · platform queueing" },
      { id: "bishan", name: "Bishan", ll: [1.3509, 103.8485], radius: 1250, base: 0.95, detail: "Signal fault · bus bridging in place" },
      { id: "jurong", name: "Jurong East", ll: [1.333, 103.742], radius: 1500, base: 0.72, detail: "Westbound boarding at the terminus" },
      { id: "woodlands", name: "Woodlands", ll: [1.437, 103.7865], radius: 1500, base: 0.62, detail: "TEL + NSL transfers, heavy northbound" },
      { id: "yishun", name: "Yishun", ll: [1.4295, 103.835], radius: 1200, base: 0.55, detail: "Your home cluster · southbound platform" },
      { id: "changi", name: "Changi", ll: [1.3563, 103.9865], radius: 1600, base: 0.3, detail: "Airport line running light" },
    ];
    const level = (v) => (v >= 0.72 ? "busy" : v >= 0.45 ? "moderate" : "light");
    const word = { busy: "Busy", moderate: "Filling", light: "Light" };
    const scored = AREAS.map((a) => {
      const v = Math.max(0.12, Math.min(0.99, a.base * slot.peak));
      const lv = level(v);
      const prev = i > 0 ? a.base * SLOTS[i - 1].peak : a.base * 0.82;
      return { ...a, v, lv, rising: v > prev + 0.01 };
    }).sort((a, b) => b.v - a.v);
    const busiest = scored[0];
    const tone = (lv) => "var(--crowd-" + lv + ")";
    const FAULTS = [
      { line: "NSL", tag: "Fault", sev: "fault", time: "07:04", title: "Signal fault between Ang Mo Kio and Newton", detail: "Trains run at reduced speed, adding about 12 min. Free bus bridging at exits A and C." },
      { line: "EWL", tag: "Delay", sev: "warn", time: "06:48", title: "Westbound delays after a door fault at Bugis", detail: "The faulty train was withdrawn at Lavender. Expect 5–7 min longer waits until 09:00." },
      { line: "BUS 969", tag: "Diversion", sev: "warn", time: "05:30", title: "Diverted around Woodlands Ave 2 roadworks", detail: "Three stops skipped in both directions. Nearest alternative: stop 46201 on Ave 6." },
      { line: "TEL", tag: "Lift", sev: "info", time: "Mon", title: "Newton lift out of service until Thursday", detail: "Step-free route is via Little India. Staff assistance available at the passenger service centre." },
    ];
    const sevTone = { fault: "var(--status-fault)", warn: "var(--status-warn)", info: "var(--sand-500)" };
    const fcRead = s.fcRead || [];
    const unread = FAULTS.map((f, idx) => idx).filter((idx) => fcRead.indexOf(idx) < 0 && FAULTS[idx].sev !== "info");
    const pinned = s.crowdOn !== false ? scored.find((a) => a.id === s.fcPin) || null : null;
    const watched = s.fcWatch || [];
    const crowdOn = s.crowdOn !== false;
    const zones = scored.map((a) => ({ id: a.id, ll: a.ll, radius: a.radius, level: a.lv, label: a.name.split(" / ")[0], pct: Math.round(a.v * 100) + "%", selected: a.id === s.fcPin }));
    return {
      fcMapCenter: [1.3521, 103.83],
      fcClock: slot.clock,
      crowdOn,
      mapZones: crowdOn && !s.dest ? zones : [],
      showCrowdBar: crowdOn && !s.dest && !s.searchOpen && !(s.query || "").trim() && !s.fcPin && !s.pin,
      toggleCrowd: () => this.setState({ crowdOn: !crowdOn, fcPin: null }),
      crowdToggleLabel: crowdOn ? "Crowding layer on" : "Crowding layer off",
      crowdToggleStyle: "position:relative;flex:none;width:46px;height:46px;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;box-shadow:0 4px 14px rgba(32,30,29,.18);" +
        (crowdOn ? "background:var(--accent);color:var(--text-on-accent,#fff);" : "background:var(--surface-card);color:var(--text-body);"),
      fcZones: zones,
      fcPickZone: (id) => this.setState({ fcPin: id, fcAlerts: false, pin: null, searchOpen: false }),
      fcRoutesHere: () => {
        if (!pinned) return;
        this.setState({ dest: { name: pinned.name, detail: word[pinned.lv] + " now · " + pinned.detail, ll: pinned.ll }, fcPin: null, tripRoute: 0 });
      },
      fcClearPin: () => this.setState({ fcPin: null }),
      fcNoPin: !pinned,
      fcWatchLabel: pinned && watched.indexOf(pinned.id) >= 0 ? "Watching" : "Alert me",
      fcWatchPinned: () => {
        if (!pinned) return;
        const on = watched.indexOf(pinned.id) >= 0;
        this.setState({ fcWatch: on ? watched.filter((x) => x !== pinned.id) : watched.concat([pinned.id]) });
        this.flash(on ? "Stopped watching " + pinned.name.split(" / ")[0] : "Alerts on for " + pinned.name.split(" / ")[0]);
      },
      fcPinned: pinned && {
        name: pinned.name,
        detail: pinned.detail,
        pct: Math.round(pinned.v * 100) + "%",
        word: word[pinned.lv] + (pinned.rising ? " · rising" : " · easing"),
        dotStyle: "flex:none;margin-top:4px;width:12px;height:12px;border-radius:999px;background:" + tone(pinned.lv),
        pctStyle: "font:var(--weight-heavy) 24px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + tone(pinned.lv),
        hours: SLOTS.map((sl, n) => {
          const v = Math.max(0.12, Math.min(0.99, pinned.base * sl.peak));
          const lv = level(v);
          const on = n === i;
          return {
            label: sl.label,
            pick: () => this.setState({ fcSlot: n }),
            barStyle: "display:block;width:100%;border-radius:6px 6px 3px 3px;height:" + Math.round(16 + v * 42) + "px;background:" + tone(lv) + ";opacity:" + (on ? 1 : 0.42) + (on ? ";box-shadow:0 0 0 1.5px var(--text-strong)" : ""),
            labelStyle: "display:block;font:" + (on ? "var(--weight-bold)" : "var(--weight-regular,400)") + " 10.5px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + (on ? "var(--text-strong)" : "var(--text-muted)"),
          };
        }),
      },
      fcHeadline: (i === 0 ? "Live · " : slot.clock + " · ") + word[busiest.lv].toLowerCase() + " around " + busiest.name.split(" / ")[0],
      fcLegend: ["busy", "moderate", "light"].map((lv) => ({
        label: { busy: "Busy — expect to stand", moderate: "Filling up", light: "Light — seats likely" }[lv],
        short: { busy: "Busy", moderate: "Filling", light: "Light" }[lv],
        swatch: "width:9px;height:9px;border-radius:999px;flex:none;background:" + tone(lv) + ";opacity:.9",
      })),
      fcSlots: SLOTS.map((sl, n) => {
        const on = n === i;
        const lv = level(Math.min(0.99, 1 * sl.peak));
        return {
          label: sl.label,
          pick: () => this.setState({ fcSlot: n }),
          style: "flex:none;display:flex;flex-direction:column;align-items:center;gap:7px;padding:9px 13px;border-radius:14px;cursor:pointer;transition:background .16s,border-color .16s;" +
            (on ? "background:var(--accent);border:1.5px solid var(--accent);" : "background:var(--sand-100);border:1.5px solid var(--border-card);"),
          timeStyle: "font:var(--weight-bold) 12.5px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + (on ? "#fff" : "var(--text-body)"),
          barStyle: "display:block;width:30px;height:4px;border-radius:999px;background:" + (on ? "#fff" : tone(lv)) + ";opacity:" + (on ? 0.9 : 0.8),
        };
      }),
      fcAreas: scored.slice(0, 4).map((a) => ({
        name: a.name, detail: a.detail, pct: Math.round(a.v * 100) + "%", trend: a.rising ? "rising" : "easing",
        dotStyle: "flex:none;width:12px;height:12px;border-radius:999px;background:" + tone(a.lv) + (a.lv === "busy" ? ";box-shadow:0 0 0 4px color-mix(in oklch, var(--crowd-busy) 18%, transparent)" : ""),
        pctStyle: "font:var(--weight-heavy) 17px/1 var(--font-numeric);font-variant-numeric:tabular-nums;color:" + tone(a.lv),
      })),
      fcFaults: (s.liveFaults || FAULTS).map((f, fi) => ({
        ...f,
        readLabel: fcRead.indexOf(fi) >= 0 ? "Read · tap to mark unread" : "Tap to mark as read",
        readDotStyle: fcRead.indexOf(fi) >= 0 ? "display:none" : "width:7px;height:7px;border-radius:999px;background:var(--status-fault)",
        toggleRead: () => this.setState({ fcRead: fcRead.indexOf(fi) >= 0 ? fcRead.filter((x) => x !== fi) : fcRead.concat([fi]) }),
        cardStyle: "width:100%;text-align:left;display:block;cursor:pointer;padding:13px 14px;border-radius:16px;background:var(--surface-card);opacity:" + (fcRead.indexOf(fi) >= 0 ? ".6" : "1") + ";border:1px solid " + (fcRead.indexOf(fi) >= 0 ? "var(--border-card)" : f.sev === "info" ? "var(--border-card)" : sevTone[f.sev]),
        badgeStyle: "flex:none;padding:3px 8px;border-radius:999px;font:var(--weight-heavy) 11px/1.3 var(--font-body);letter-spacing:.02em;color:#fff;background:" + sevTone[f.sev],
        tagStyle: "font:var(--weight-semibold) 11px/1 var(--font-body);letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)",
      })),
      fcFaultCount: unread.length ? unread.length + " unread" : "All read",
      fcFaultN: unread.length,
      fcHasFaults: unread.length > 0,
      fcHasUnread: unread.length > 0,
      fcMarkAllRead: () => { this.setState({ fcRead: FAULTS.map((f, idx) => idx) }); this.flash("All alerts marked read"); },
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
    if (this.state.dest !== prevState.dest && this.state.dest) this.scheduleLiveRoute();
  }
  componentDidMount() {
    this.t0 = Date.now();
    this.iv = setInterval(() => this.setState({ tick: Date.now() }), 1000);
    this.locT = setTimeout(() => this.setState({ locFix: true }), 1400);
    this.loadLiveFaults();
  }
  componentWillUnmount() {
    clearInterval(this.iv);
    if (this.tt) clearTimeout(this.tt);
    if (this.locT) clearTimeout(this.locT);
    if (this._searchT) clearTimeout(this._searchT);
  }

  // Live OneMap place search, debounced. Falls back to the illustrative
  // PLACES list in renderVals() whenever this fails or a key isn't set.
  scheduleLiveSearch = () => {
    if (this._searchT) clearTimeout(this._searchT);
    const query = this.state.query;
    if (!query || !query.trim()) {
      this.setState({ liveResults: null });
      return;
    }
    this._searchT = setTimeout(async () => {
      try {
        const items = await searchPlaces(query);
        this.setState({
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
        this.setState({ liveResults: null });
      }
    }, 350);
  };

  // Live OneMap public-transport routing for the picked destination. Falls
  // back to the synthetic curved line in renderVals() when it fails.
  scheduleLiveRoute = () => {
    const dest = this.state.dest;
    if (!dest || !dest.ll) return;
    const ORIGIN = [1.4294, 103.835];
    getPublicTransportRoute(ORIGIN, dest.ll)
      .then((data) => {
        const itin = data && data.plan && data.plan.itineraries && data.plan.itineraries[0];
        if (!itin) return;
        const coords = [];
        (itin.legs || []).forEach((leg) => {
          if (leg.legGeometry && leg.legGeometry.points) coords.push(...decodePolyline(leg.legGeometry.points));
        });
        if (coords.length > 1 && this.state.dest && this.state.dest.name === dest.name) {
          this.setState({ liveRoute: { destKey: dest.name, coords } });
        }
      })
      .catch(() => {});
  };

  // Live LTA DataMall train service alerts, replacing the illustrative
  // FAULTS list in forecastVals() when available.
  loadLiveFaults = () => {
    getTrainServiceAlerts()
      .then((data) => {
        const alerts = data && data.Status === 2 && Array.isArray(data.AffectedSegments) ? data.AffectedSegments : null;
        if (!alerts || !alerts.length) return;
        const liveFaults = alerts.slice(0, 6).map((seg) => ({
          line: seg.Line, tag: "Delay", sev: "warn", time: "Now",
          title: (seg.Line || "Line") + " — " + (seg.Direction || "") + " running slower",
          detail: "Between " + (seg.StartStation || "?") + " and " + (seg.EndStation || "?") + ". " + (seg.Stations || ""),
        }));
        this.setState({ liveFaults });
      })
      .catch(() => {});
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
  levels(v) { const l = this.level(v); return l === "light" ? ["light", "light", "moderate"] : l === "moderate" ? ["moderate", "moderate", "light"] : ["busy", "busy", "moderate"]; }
  barsFor(l) { return [{ style: { width: "11px", height: "11px", borderRadius: "999px", background: CROWD[l], display: "block" } }]; }
  bars(v) { return this.barsFor(this.level(v)); }
  snaps(H) { return [190, Math.round(H * 0.55), Math.round(H - 104)]; }

  navSteps(o, destShort) {
    if (!o) return [];
    const legs = o.legs.map((l) => (typeof l === "string" ? l : l.label));
    const inter = ["Newton", "Botanic Gardens", "Bishan", "Outram Park"];
    const total = o.mins * 60, fixed = 5 * 60 + 4 * 60 + (legs.length - 1) * 3 * 60;
    const ride = Math.max(150, Math.round((total - fixed) / Math.max(1, legs.length)));
    const steps = [{ icon: "footprints", title: "Walk to Yishun (NS13)", detail: "350 m · Exit B, follow the covered walkway", secs: 300 }];
    legs.forEach((lg, idx) => {
      const bus = /BUS/i.test(lg);
      if (idx > 0) steps.push({ icon: "arrow-left-right", title: "Transfer at " + inter[(idx - 1) % 4], detail: "3 min walk · follow signs to " + lg, secs: 180 });
      const SEQ = {
        NS: ["Khatib", "Yio Chu Kang", "Ang Mo Kio", "Bishan", "Braddell", "Toa Payoh", "Novena", "Newton"],
        DT: ["Little India", "Rochor", "Bugis", "Promenade", "Bayfront", "Downtown", "Telok Ayer", "Chinatown"],
        TE: ["Springleaf", "Lentor", "Mayflower", "Bright Hill", "Upper Thomson", "Caldecott", "Stevens", "Napier"],
        EW: ["Clementi", "Dover", "Buona Vista", "Commonwealth", "Queenstown", "Redhill", "Tiong Bahru", "Outram Park"],
        BU: ["Yishun Ave 2", "Khatib Stn", "Yio Chu Kang Stn", "AMK Hub", "Bishan Stn", "Marymount", "Thomson Plaza"],
      };
      const seq = SEQ[bus ? "BU" : lg.slice(0, 2).toUpperCase()] || SEQ.NS;
      const nStops = bus ? 6 : 4 + idx * 2;
      const stops = seq.slice(0, nStops);
      steps.push({
        icon: bus ? "bus" : "train-front",
        title: "Board " + lg + " toward " + (bus ? "Thomson Plaza" : idx % 2 ? "Jurong East" : "Marina South Pier"),
        detail: nStops + " stops · alight at " + stops[stops.length - 1] + (bus ? "" : " · Platform " + (idx % 2 ? "A" : "B")),
        stops, alight: stops[stops.length - 1], secs: ride,
      });
    });
    steps.push({ icon: "flag", title: "Walk to " + destShort, detail: "300 m · arrive at the main entrance", secs: 240 });
    return steps;
  }

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

  mins(base) {
    const el = this.state.tick && this.t0 ? (this.state.tick - this.t0) / 60000 : 0;
    let t = base - el;
    while (t <= 0) t += 14;
    return t < 1 ? 1 : Math.round(t);
  }

  renderVals() {
    const s = this.state, sc = s.screen;
    const modeName = { rush: "Rush", comfort: "Comfort", silver: "Silver" }[s.mode];
    const blurb = {
      rush: "Fastest arrival. Crowding is ignored — expect to stand from Bishan.",
      comfort: "Routes around the two busiest platforms. About 6 min slower, far better odds of a seat.",
      silver: "Fewest transfers, step-free throughout, longer walking buffers.",
    }[s.mode];

    const routeSets = {
      rush: [
        { mins: 41, eta: "08:22", tag: "Fastest", tagTone: "soft", legs: [["NSL", "accent"], ["BUS 969", "dark"], ["NSL", "accent"], ["NEL", "soft"]], v: 0.88, note: "Uses the affected stretch with bus bridging. Quickest, but standing." },
        { mins: 46, eta: "08:27", tag: "Backup", tagTone: "outline", legs: [["NSL", "accent"], ["DTL", "soft"], ["EWL", "soft"]], v: 0.74, note: "One extra transfer. Skips the bridging queue at Ang Mo Kio." },
        { mins: 52, eta: "08:33", tag: "Surface", tagTone: "neutral", legs: [["BUS 855", "dark"], ["NEL", "soft"]], v: 0.52, note: "Road congestion on the CTE is moderate and clearing." },
      ],
      comfort: [
        { mins: 48, eta: "08:29", tag: "Best seat odds", tagTone: "soft", legs: [["NSL", "accent"], ["DTL", "soft"], ["EWL", "soft"]], v: 0.41, note: "Boards the DTL two stops before the crowd builds." },
        { mins: 44, eta: "08:25", tag: "Balanced", tagTone: "outline", legs: [["NSL", "accent"], ["BUS 969", "dark"], ["NSL", "accent"]], v: 0.69, note: "Quicker, but the bridging bus is standing-room from Bishan." },
        { mins: 55, eta: "08:36", tag: "Quietest", tagTone: "soft", legs: [["BUS 856", "dark"], ["TEL", "soft"]], v: 0.28, note: "The TEL is running light. Longest ride, emptiest carriage." },
      ],
      silver: [
        { mins: 51, eta: "08:32", tag: "Step-free", tagTone: "soft", legs: [["NSL direct", "accent"]], v: 0.44, note: "No transfers. Lift at both ends, 9 min platform buffer." },
        { mins: 58, eta: "08:39", tag: "Seated", tagTone: "soft", legs: [["BUS 856", "dark"], ["NSL", "accent"]], v: 0.3, note: "Bus first, boarding at the terminus. A seat is near certain." },
        { mins: 47, eta: "08:28", tag: "One transfer", tagTone: "outline", legs: [["NSL", "accent"], ["DTL", "soft"]], v: 0.58, note: "Shorter, but Newton has 42 steps when the lift is busy." },
      ],
    };
    const routes = routeSets[s.mode].map((r, i) => ({
      ...r, pick: () => this.setState({ route: i }), tone: s.route === i ? "outlined" : "plain",
      legs: r.legs.map(([label]) => ({ label, style: this.lineStyle(label) })),
      bars: this.bars(r.v), crowd: WORD[this.level(r.v)],
    }));

    const hourLabels = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

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

    const calTrips = [
      { time: "09:30", title: "Design review", route: "Yishun → Raffles Place · NSL", leave: "08:41", urgent: true, tags: [{ label: "Calendar", tone: "outline" }, { label: "Disruption", tone: "warn", icon: "triangle-alert" }] },
      { time: "13:00", title: "Lunch with Priya", route: "Raffles Place → Telok Ayer · DTL", leave: "12:38", urgent: false, tags: [{ label: "Calendar", tone: "outline" }] },
      { time: "19:15", title: "Badminton", route: "Raffles Place → Toa Payoh · NSL", leave: "18:26", urgent: true, tags: [{ label: "Calendar", tone: "outline" }, { label: "Rain forecast", tone: "warn", icon: "cloud-rain" }] },
    ].map((c, i) => ({
      ...c,
      open: s.calOpen === i,
      detail: "Leave " + c.leave + " to arrive by " + c.time + ". " + c.route + (c.urgent ? " · watch this one, conditions may change." : " · running normally right now."),
      setRef: (el) => { (this.calEls || (this.calEls = {}))[i] = el; },
      toggle: () => {
        const opening = s.calOpen !== i;
        this.setState({ calOpen: opening ? i : null });
        if (!opening) return;
        setTimeout(() => {
          const el = this.calEls && this.calEls[i];
          if (!el) return;
          let scEl = el.parentElement;
          while (scEl && !(scEl.scrollHeight > scEl.clientHeight + 8 && /auto|scroll/.test(getComputedStyle(scEl).overflowY))) scEl = scEl.parentElement;
          if (!scEl) return;
          const top = el.offsetTop - scEl.offsetTop;
          const need = top + el.offsetHeight - (scEl.scrollTop + scEl.clientHeight) + 16;
          if (need > 0) scEl.scrollTo({ top: scEl.scrollTop + need, behavior: "smooth" });
        }, 80);
      },
      plan: () => { this.setState({ screen: "map" }); this.flash("Routes for " + c.title + " · leave " + c.leave); },
      watch: () => this.flash("Alerts on for " + c.title + " · checked 25 min before " + c.leave),
    }));

    const ORIGIN = [1.4294, 103.835];
    const PLACES = [
      { name: "NANYANG TECHNOLOGICAL UNIVERSITY ( HALL OF RESIDENCE 13)", detail: "62 Nanyang Crescent · 637667", kind: "Address", ll: [1.3483, 103.6831] },
      { name: "Tan Tock Seng Hospital", detail: "11 Jalan Tan Tock Seng · 308433", kind: "Address", ll: [1.3215, 103.8459] },
      { name: "ION Orchard", detail: "2 Orchard Turn · 238801", kind: "Address", ll: [1.304, 103.8318] },
      { name: "768888", detail: "Blk 726 Yishun Street 71", kind: "Postal", ll: [1.4304, 103.8354] },
      { name: "Bus stop 59009", detail: "Yishun Avenue 2 · opposite Northpoint", kind: "Bus stop", ll: [1.4295, 103.835] },
      { name: "Bishan (NS17)", detail: "Bishan Road · North South Line", kind: "Station", ll: [1.3509, 103.8485] },
      { name: "Changi Airport Terminal 3", detail: "65 Airport Boulevard · 819663", kind: "Address", ll: [1.3563, 103.9865] },
      { name: "Gardens by the Bay", detail: "18 Marina Gardens Drive · 018953", kind: "Address", ll: [1.2816, 103.8636] },
    ];
    const localMatches = PLACES.filter((p) => (p.name + " " + p.detail).toLowerCase().indexOf((s.query || "").trim().toLowerCase()) >= 0);
    const livePlaces = s.liveResults && s.liveResults.query === s.query ? s.liveResults.items : null;
    const q = s.query.trim().toLowerCase();
    const resultSource = livePlaces || (q ? localMatches : PLACES);
    const results = resultSource.slice(0, 6).map((p) => ({ ...p, pick: () => this.setState({ dest: p, tripRoute: 0 }) }));

    const dest = s.dest;
    const bend = (k) => {
      if (!dest) return [];
      if (s.liveRoute && s.liveRoute.destKey === dest.name) return s.liveRoute.coords;
      const [a1, a2] = ORIGIN, [b1, b2] = dest.ll, dx = b1 - a1, dy = b2 - a2;
      return [ORIGIN, [a1 + dx * 0.34 - dy * k, a2 + dy * 0.34 + dx * k], [a1 + dx * 0.68 - dy * k * 0.6, a2 + dy * 0.68 + dx * k * 0.6], dest.ll];
    };
    const tripSets = {
      fast: [
        { mins: 44, eta: "08:26", fare: "$2.17", walk: "7 min", tag: "Fastest", tagTone: "soft", legs: ["NSL", "DTL"], v: 0.82, note: "Two transfers, no waiting at either." },
        { mins: 49, eta: "08:31", fare: "$2.05", walk: "4 min", tag: "Fewer steps", tagTone: "outline", legs: ["NSL", "BUS 167"], v: 0.64, note: "Slightly longer, one transfer less." },
        { mins: 58, eta: "08:40", fare: "$1.89", walk: "11 min", tag: "Direct", tagTone: "neutral", legs: ["BUS 969"], v: 0.51, note: "Single bus the whole way." },
      ],
      budget: [
        { mins: 61, eta: "08:43", fare: "$1.29", walk: "12 min", tag: "Cheapest", tagTone: "soft", legs: ["BUS 969", "BUS 167"], v: 0.56, note: "Bus only. Transfer rebate applies within 45 min." },
        { mins: 55, eta: "08:37", fare: "$1.68", walk: "9 min", tag: "Balanced", tagTone: "outline", legs: ["BUS 969", "NSL"], v: 0.68, note: "One rail leg keeps it under the hour." },
        { mins: 44, eta: "08:26", fare: "$2.17", walk: "7 min", tag: "Fastest", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.82, note: "Quickest, but 88 cents more." },
      ],
      step: [
        { mins: 52, eta: "08:34", fare: "$2.05", walk: "5 min", tag: "Step-free", tagTone: "soft", legs: ["NSL direct"], v: 0.58, note: "Lift at every change. No stairs, no escalator." },
        { mins: 57, eta: "08:39", fare: "$1.89", walk: "3 min", tag: "Least walking", tagTone: "outline", legs: ["BUS 969", "NSL"], v: 0.47, note: "Wheelchair-accessible bus, kerbside both ends." },
        { mins: 49, eta: "08:31", fare: "$2.17", walk: "8 min", tag: "One lift out", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.7, note: "Newton lift is out of service until Thursday." },
      ],
      quiet: [
        { mins: 56, eta: "08:38", fare: "$2.05", walk: "8 min", tag: "Quietest", tagTone: "soft", legs: ["BUS 856", "TEL"], v: 0.27, note: "The TEL is running light at this hour." },
        { mins: 51, eta: "08:33", fare: "$2.11", walk: "6 min", tag: "Seat likely", tagTone: "outline", legs: ["NSL", "DTL"], v: 0.42, note: "Boards two stops before the crowd builds." },
        { mins: 44, eta: "08:26", fare: "$2.17", walk: "7 min", tag: "Fastest", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.82, note: "Quickest, but busy from Bishan onwards." },
      ],
      few: [
        { mins: 53, eta: "08:35", fare: "$2.05", walk: "9 min", tag: "No transfers", tagTone: "soft", legs: ["NSL direct"], v: 0.61, note: "Stay on one train the whole way." },
        { mins: 50, eta: "08:32", fare: "$2.11", walk: "6 min", tag: "One transfer", tagTone: "outline", legs: ["BUS 856", "NSL"], v: 0.55, note: "Single change, same platform." },
        { mins: 44, eta: "08:26", fare: "$2.17", walk: "7 min", tag: "Fastest", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.82, note: "Two changes, but the quickest overall." },
      ],
      walk: [
        { mins: 59, eta: "08:41", fare: "$1.89", walk: "2 min", tag: "Door to door", tagTone: "soft", legs: ["BUS 969"], v: 0.49, note: "Stops 80 m from the entrance." },
        { mins: 54, eta: "08:36", fare: "$2.05", walk: "4 min", tag: "Short walk", tagTone: "outline", legs: ["BUS 856", "NSL"], v: 0.58, note: "Sheltered walkway at both ends." },
        { mins: 47, eta: "08:29", fare: "$2.17", walk: "10 min", tag: "Faster", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.74, note: "Quicker, but a longer walk out." },
      ],
      bike: [
        { mins: 41, eta: "08:23", fare: "$1.20", walk: "0 min", tag: "Bike + rail", tagTone: "soft", legs: ["CYCLE 1.8 km", "NSL"], v: 0.38, note: "Docking bay outside the station." },
        { mins: 46, eta: "08:28", fare: "$0.00", walk: "0 min", tag: "All the way", tagTone: "outline", legs: ["CYCLE 9.4 km"], v: 0.1, note: "Park Connector the whole route." },
        { mins: 44, eta: "08:26", fare: "$2.17", walk: "7 min", tag: "Rail only", tagTone: "neutral", legs: ["NSL", "DTL"], v: 0.82, note: "No bike needed, but busier." },
      ],
    };
    const tripOptions = tripSets[s.tripMode].map((o, i) => ({
      ...o, pick: () => this.setState({ tripRoute: i }), tone: s.tripRoute === i ? "accent" : "hairline",
      start: (e) => { if (e && e.stopPropagation) e.stopPropagation(); this.setState({ tripRoute: i, navRoute: i, screen: "nav", navStart: Date.now() }); },
      legs: o.legs.map((label) => ({ label, style: this.lineStyle(label) })),
      bars: this.bars(o.v), crowd: WORD[this.level(o.v)],
    }));
    const bendBy = { fast: 0.06, budget: -0.09, step: 0.02, quiet: -0.04 }[s.tripMode] ?? 0.03;

    const destShort = dest ? dest.name.split(" (")[0].replace(/\s+$/, "") : "your destination";
    const navOpt = tripOptions[s.navRoute != null ? s.navRoute : s.tripRoute] || tripOptions[0];
    const navArr = this.navSteps(navOpt, destShort);
    const navTotal = navArr.reduce((a, b) => a + b.secs, 0) || 1;
    const navElapsed = Math.min(navTotal, s.navStart ? (((s.tick || Date.now()) - s.navStart) / 1000) * 12 : 0);
    let acc = 0, navIdx = 0, stepRem = 0;
    for (let idx = 0; idx < navArr.length; idx++) {
      if (navElapsed < acc + navArr[idx].secs || idx === navArr.length - 1) { navIdx = idx; stepRem = acc + navArr[idx].secs - navElapsed; break; }
      acc += navArr[idx].secs;
    }
    const arrived = navElapsed >= navTotal - 1;
    this._navIdx = navIdx;
    const navFrac = navElapsed / navTotal;
    const fmtS = (x) => (x >= 60 ? Math.ceil(x / 60) + " min" : Math.max(0, Math.ceil(x)) + " s");
    const curStep = navArr[navIdx] || {};
    const stepProg = curStep.secs ? Math.max(0, Math.min(1, 1 - stepRem / curStep.secs)) : 0;
    const curStops = curStep.stops || null;
    const passed = curStops ? Math.min(curStops.length - 1, Math.floor(stepProg * curStops.length)) : 0;
    const stopsLeft = curStops ? curStops.length - passed : 0;
    const liveStopLine = curStops ? "Next: " + curStops[passed] + " · " + stopsLeft + " stop" + (stopsLeft === 1 ? "" : "s") + " to " + curStep.alight : curStep.detail;
    const nav = {
      navIcon: arrived ? "circle-check" : curStep.icon,
      navTitle: arrived ? "You have arrived" : curStep.title,
      navDetail: arrived ? destShort : liveStopLine,
      navCountdown: arrived ? "Done" : fmtS(stepRem),
      navStepLabel: arrived ? "Trip complete" : "Step " + (navIdx + 1) + " of " + navArr.length,
      navEta: navOpt ? navOpt.eta : "",
      navRemainLabel: arrived ? "Arrived · " + destShort : Math.max(1, Math.ceil((navTotal - navElapsed) / 60)) + " min left · " + destShort,
      navCoord: this.lerpRoute(bend(bendBy), navFrac) || ORIGIN,
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
      showResults: !s.dest && (s.searchOpen || q.length > 0),
      openSearch: () => this.setState({ searchOpen: true }),
      closeSearch: () => { if (this.bt) clearTimeout(this.bt); this.bt = setTimeout(() => this.setState({ searchOpen: false }), 160); },
      query: s.query, setQuery: (val) => this.setState({ query: val }), clearQuery: () => this.setState({ query: "" }),
      results, resultsLabel: q ? "Results for “" + s.query.trim() + "”" : "Recent and nearby",
      destName: dest ? dest.name : "", destDetail: dest ? dest.detail : "",
      destCoord: dest ? dest.ll : null, originCoord: ORIGIN, mapCenter: ORIGIN, routeCoords: bend(bendBy),
      backToSearch: () => this.setState({ dest: null }),
      pinCoord: s.pin ? s.pin.ll : null,
      hasPin: !!s.pin && !dest && !s.fcPin,
      showMapAttrib: !dest && !s.pin && !s.fcPin && s.crowdOn === false,
      showPinHint: !s.pin && !dest && !s.searchOpen && !q && !s.fcPin && s.crowdOn === false,
      pinName: s.pin ? s.pin.name : "",
      pinDetail: s.pin ? s.pin.detail : "",
      dropPin: (ll) => {
        if (this.state.dest) return;
        let best = null, bd = 1e9;
        PLACES.forEach((p) => {
          const d = Math.abs(p.ll[0] - ll[0]) + Math.abs(p.ll[1] - ll[1]);
          if (d < bd) { bd = d; best = p; }
        });
        const near = bd < 0.012 ? best : null;
        this.setState({ pin: { ll, name: near ? near.name : "Dropped pin", detail: (near ? near.detail + " · " : "") + ll[0].toFixed(4) + ", " + ll[1].toFixed(4), place: near } });
      },
      clearPin: () => this.setState({ pin: null }),
      pinDirections: () => {
        const p = this.state.pin;
        if (!p) return;
        this.setState({ dest: p.place || { name: p.name, detail: p.detail, ll: p.ll, kind: "Pin" }, tripRoute: 0, pin: null, sheetH: 430 });
      },
      pinSearch: () => {
        const p = this.state.pin;
        if (!p) return;
        this.setState({ query: p.place ? p.place.name : "", searchOpen: true, pin: null });
        this.flash("Showing places near the pin");
      },
      setSheetRef: (el) => { this.sheetEl = el; },
      sheetWrapStyle: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 15, display: "flex", height: (s.sheetH || 430) + "px", transition: s.sheetDrag ? "none" : "height var(--dur-base) var(--ease-out)" },
      sheetStyle: { flex: 1, minHeight: 0, width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", background: "var(--surface-card)", borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0", boxShadow: "var(--shadow-sheet)", display: "flex", flexDirection: "column", padding: "0 16px" },
      sheetGrabStyle: { flex: "none", padding: "10px 0 12px", cursor: s.sheetDrag ? "grabbing" : "grab", touchAction: "none", userSelect: "none" },
      sheetDragStart: (e) => this.startSheetDrag(e),
      pickedMins: (tripOptions[s.tripRoute] || tripOptions[0] || {}).mins,
      tripModeItems: [{ id: "fast", label: "Fastest" }, { id: "budget", label: "Budget" }, { id: "step", label: "Step-free" }, { id: "quiet", label: "Less crowded" }],
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
        fast: "Shortest total time, whatever it costs and however full it is.",
        budget: "Cheapest fare first. Bus legs and transfer rebates are preferred.",
        step: "Lifts and level boarding only. Walking distance is kept short.",
        quiet: "Avoids the busiest platforms and carriages, even if it adds minutes.",
        few: "Keeps you on one vehicle where possible. At most one change.",
        walk: "Minimises time on foot. Stops as close to the door as possible.",
        bike: "Pairs a short ride to the station with rail, or cycles the whole way.",
      }[s.tripMode],
      tripOptions,
      startMapTrip: () => { this.setState({ screen: "nav", navRoute: s.tripRoute, navStart: Date.now() }); },
      isNav: sc === "nav",
      endTrip: () => { this.setState({ screen: "map" }); this.flash("Trip ended"); },
      goReport: () => this.setState({ navRepOpen: true, nrType: null, nrSev: null }),
      ...nav,
      headerTitle: { map: "Map", report: "Report", rewards: "Points", plan: "Today" }[sc] || "Solvik",
      headerSub: {
        map: "From Blk 726 Yishun St 71 · OneMap",
        report: "Bishan (NS17) · reports stay live 30 min",
        rewards: "Tue 8 Sep · 18 reports this month",
        plan: "Tue 8 Sep · 3 trips",
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
      goLive: () => this.go("map"), goRewards: () => this.go("rewards"),
      modeItems: [{ id: "rush", label: "Rush" }, { id: "comfort", label: "Comfort" }, { id: "silver", label: "Silver" }],
      mode: s.mode, setMode: (id) => this.setState({ mode: id, route: 0 }), modeBlurb: blurb, modeName,
      routes, activeLegs: routes[s.route] ? routes[s.route].legs : [],
      startJourney: () => { this.setState({ screen: "nav", navRoute: s.route, navStart: Date.now() }); this.flash("Trip started · watching it live"); },
      ...this.forecastVals(s),
      filterItems: [{ id: "all", label: "All" }, { id: "train", label: "Train" }, { id: "bus", label: "Bus" }],
      filter: s.filter, setFilter: (id) => this.setState({ filter: id }),
      hourLabels, fcLabel: hourLabels[s.fc],
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
      locEyebrow: s.locFix ? "Live at your stop" : "Finding your stop",
      locStopName: s.locFix ? "Bishan (NS17)" : "Locating…",
      locDetail: s.locFix ? "Nearest stop · 40 m away · 247 commuters nearby · reports stay live 30 min" : "Using your location to pick the stop you can report on.",
      locRecheckLabel: s.locFix ? "Recheck" : "Locating",
      locRecheck: () => {
        this.setState({ locFix: false });
        if (this.locT) clearTimeout(this.locT);
        this.locT = setTimeout(() => { this.setState({ locFix: true }); this.flash("Nearest stop · Bishan (NS17), 40 m away"); }, 1100);
      },
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
      crowdLegend: ["light", "moderate", "busy"].map((l) => ({ label: WORD[l], bars: this.barsFor(l) })),
      points: s.points.toLocaleString(), vouchers,
      toGold: Math.max(0, 3100 - s.points).toLocaleString(),
      tierBarStyle: { width: Math.round(Math.max(0, Math.min(1, (s.points - 1000) / 2100)) * 100) + "%", height: "100%", background: "var(--crowd-light)", borderRadius: 999, transition: "width var(--dur-slow) var(--ease-out)" },
      pointStats: [
        { icon: "megaphone", value: "18", label: "Reports this month" },
        { icon: "badge-check", value: "94%", label: "Verified by others" },
        { icon: "users", value: "2.1k", label: "Commuters helped" },
      ],
      calOff: s.cal !== "on", calOn: s.cal === "on", calCta: s.cal === "linking" ? "Connecting" : "Connect",
      connectCal: () => { this.setState({ cal: "linking" }); setTimeout(() => { this.setState({ cal: "on" }); this.flash("3 trips synced from the calendar"); }, 900); },
      disconnectCal: () => this.setState({ cal: "off" }), calTrips,
      ...this.addCommuteVals(s),
      callHelp: () => this.flash("Calling Daniel"),
    };
  }
}
