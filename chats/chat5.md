# Laptop view design approach

_Started 2026-09-14 12:19 UTC_

---

## User

Continuing from "Apply drawing".

## Assistant

We were building out Solvik, a public-transport app that unifies maps, trip planning, crowding alerts, and community reporting. The onboarding now captures travel profile (commuter, student, wheelchair user, etc.) and home/work/school addresses to personalise routing. The Plan tab became the hero screen showing the next upcoming commute with live crowding, places as compact tiles, and saved daily commutes in a tabular list.

Key decisions: stripped the navigation to five core tabs (Intro / Map / Plan / Report / Points), removed routes/alerts/forecast/setup as separate screens and embedded them into the map sheet or Plan card, made the trip sheet draggable with three snap heights so the map stays central during navigation, and redesigned Plan around a next-up hero card instead of a search-first layout.

Current state: Onward.dc.html is a working prototype with all five tabs live. Intro walks through profile + places (first run only). Map shows OneMap with zoomable canvas, tappable crowding zones with hourly forecasts, mode chips swapping routes, and a slide-up Report sheet (photo required, fault-specific questions). Plan displays the next commute hero, Your places edit sheet, and Watched daily list. Report tab shows the 6-fault grid. Points accumulates from reporting. Calendar trips expand in place on Plan. The add-commute sheet is fully wired on Plan. Search areas in the Places edit sheet now open a dropdown results panel with matching addresses.

Open next step: the search area dropdown was being cut off — likely a z-index or overflow issue. Verify the results panel stacks above the sheet and fits on mobile. Then deploy to Vercel.

Project files: Onward.dc.html (main), onemap-canvas.jsx (map interaction), Solvik Design System (tokens).

## User

I think it's time to design laptop view based on this current mobile view. Don't add all features in a single page.

## Assistant

_[tool: update_todos]_

Usage quota is at 91%, so I'm pausing before starting the desktop design — it's a substantial build and I don't want to leave it half-finished.

There's already an `Onward Desktop.dc.html` in the project. My plan when you say go:

- **Desktop = map-first workspace**, not a stack of mobile screens. Left rail nav (Map / Plan / Report / Points), persistent left panel for trip details, full-bleed OneMap filling the rest.
- **Split by page, not tabs**: one screen for *Map + live trip* (crowding zones, mode switching, step-free), a second for *Plan* (next-up commute, watched commutes, places) laid out as a two-column dashboard.
- Report stays a modal over whichever screen you're on — it's a task, not a destination.

Say "go" and I'll build the map workspace screen first.

## User

go

## Assistant

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Now building the laptop Map workspace.

_[tool: dc_write]_

_[tool: show_html]_

_[tool: ready_for_verification]_

`Onward Laptop.dc.html` — the Map workspace only, as its own screen.

What's desktop-specific rather than a stretched phone: both start and destination visible at once with a swap control, all three route options listed permanently beside the map (hover previews a route, click expands its step-by-step), the crowding layer + legend always on screen instead of behind a toggle sheet, and the area forecast as a pinned side card rather than a modal.

The rail shows Plan / Report / Points but doesn't implement them — each says so when clicked. Tell me which to build next and I'll make it a separate screen. (The older `Onward Desktop.dc.html` is untouched; it still reflects the retired Live/Forecast IA, so I'd retire it once the new set is in place.)

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Fixed the three constraint problems: the shell now reflows (`min-height:100vh` + wrap) instead of half-clipping a fixed-height layout, the map overlay row wraps with `min-width:0` on both children so the service-status card can't get pushed out and squeezed, and the map column has a real `min-width`/`min-height` while the route panel shrinks from 408px down to 300px. The area card is also capped to the map's width.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Restored the true two-pane shell: `height:100dvh` + `overflow:hidden` so nothing scrolls at document level, panel `flex:0 1 408px` with a 330px floor, and the map `flex:1 1 auto;min-width:0` so it shrinks rather than wrapping below the fold. The route list scrolls inside its own card, as intended.

## User

I feel like the map is moving on its own

## Assistant

The hover-preview was re-fitting the map every time your cursor crossed a route card. Pinning the map to the *selected* route only.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Map now only moves when you pick a different route (or change mode). Hover just lifts the card in the list.

## User

Apply drawing

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

The trip panel now collapses: a hide button sits in the "Plan a trip" header, and when hidden the map goes full width with a "Plan a trip" pill at top-left to bring it back.

## User

I feel like the text size is so small for desktop view.

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Bumped the whole type scale one step for desktop reading distance — done by overriding the Solvik size tokens on this page, so the design-system components (search fields, tabs, buttons, badges) scale with it rather than drifting out of sync. Body 17→19, caption 13→15, heading 22→26; the route duration numeral is 40px. Panel widened to 452px to hold the larger text.

## User

Apply drawing

## Assistant

Two things are happening: the type is still small, and the design-system components are compressing (that's why "Step-free" and "Busy at Bishan" break mid-word). Fixing both.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Bigger again — body 20px, captions 17px, crowding words 18px, rail labels 14px with 25px icons.

The mid-word breaks ("Step-/free", "Busy at / Bishan", "Send to / phone") weren't a font-size issue: the design-system components are flex rows whose children shrink, so they were being squeezed. Fixed by giving them room — panel now 508px, rail 98px — plus taking the crowding label out of the meter so it can't wrap, and stacking the two footer buttons full-width instead of side by side.

## User

Apply drawing

## Assistant

Wiring Plan, Report and Points as floating panels over the map, plus replacing the tab component that kept breaking "Step-free" with non-shrinking pills.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the logic.

_[tool: dc_js_str_replace]_

## Assistant

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

_[tool: update_todos]_

The rail is live now. Plan, Report and Points open as floating panels over the map rather than replacing it — the map stays the constant on desktop, since it's the one thing a large screen is actually good for.

- **Plan** — next-up commute with live crowding plus the three watched commutes; clicking one loads it into the map and closes the panel, bell toggles alerts per trip.
- **Report** — 6-fault grid, then the fault-specific question and required photo; sending adds points and files it in the Points history.
- **Points** — 340 pts with progress to the 500-pt free fare; redeem unlocks at 500.

Also replaced the segmented tabs with non-shrinking pills, which fixes "Step-free" breaking mid-word.

## User

Apply drawing

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

The left trip panel is now the **Plan** tab: pressing Plan opens it, pressing Map closes it for a full-bleed map, and the hide button in its header just switches you back to Map. Plan is the tab on load.

Watched commutes moved into the bottom of that panel's scroll, so Plan holds both planning a new trip and your saved ones. Report and Points still open as overlays over the map.

## User

Apply drawing

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Added a location search bar as the first item in the map's top-left overlay — it filters 16 stations and places as you type, shows matches in a dropdown below (with station line codes as subtitles), and picking one recenters the map. Enter selects the top match, Esc closes, and the field's bottom corners square off while the dropdown is open so the two read as one surface.

## User

Apply drawing

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Searching a place now routes to it: picking a result (or pressing Enter) sets your current location as the start and that place as the destination, opens the Plan panel, and draws the route on the map with origin and destination markers.

The three options are generated from the real distance — rail, single-bus, and step-free — each with its own line on the map, timings from 07:21, and step-by-step naming the actual place. Clearing the search returns to the default Yishun → Raffles Place trip.

## User

Apply drawing

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

The map is now full-bleed edge to edge, with the nav rail and every panel floating above it as overlays. The map overlay row, area card and Report/Points panels shift right when the trip panel is open so nothing sits underneath it, and snap back to the rail edge when it's closed.

## User

Apply drawing

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Tightened the rail to hug its contents — it's now a compact block at the top instead of a full-height column with a big empty middle, and the avatar sits directly under Points.

