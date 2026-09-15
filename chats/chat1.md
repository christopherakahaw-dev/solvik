# Commute app UI mockups

_Started 2026-09-13 03:16 UTC_

---

## User

Create UI mockups for different screens

Our idea is simple but effective for daily commuters, tailored for all age groups, and designed to help both commuters and LTA manage peak-hour stress.

Almost everyone gets overwhelmed whenever they face a disruption, such as train delays, station overcrowding, or bus bridging scenarios. Instead of users finding out when they are already stuck at the gantry, our app is proactive. Whether our users are on their way to school, work, or back home, the app monitors their saved usual commutes. If an incident or heavy surface congestion occurs, the app will send a push notification and navigate users to an optimized route before they even begin their journey.

Depending on the users' preferences and circumstances, they will be able to pick different routing modes, such as Rush, Comfort, or Silver mode. If they are in a hurry, Rush mode will navigate them to the fastest possible route. If the user chooses Comfort mode, the app will reroute them away from congested nodes to help them get a seat or avoid the worst of the peak-hour crush. This doubles as a crowd dispersal tool to help LTA manage passenger surges. To truly cater to all age groups, we are also including a Silver mode for seniors or less tech-savvy users, which simplifies the screen with larger text and easy, one-tap route alternatives.

Users will be able to view real-time arrival times for buses and, more importantly, trains in one unified dashboard. We also plan to use LTA's data to predict crowding before it happens, so the app can suggest alternatives early if, for example, it's raining in the CBD during the evening rush.

Last but not least, we are adding a crowdsourced feature for live updates, similar to Waze but for public transport. Users can report on circumstances at the train stations—like a packed platform or a broken escalator—to earn points. These points can be used for vouchers and discounts, which keeps users engaged while providing LTA with instant, ground-level data.

I want to add this feature and add a button to connect to google calendar and sync the trips from google calendar directly to the app. Users will be able to view real-time arrival times for buses and, more importantly, trains in one unified dashboard. We also plan to use LTA's data to predict crowding before it happens, so the app can suggest alternatives early if, for example, it's raining in the CBD during the evening rush.

## Assistant



## Assistant

_[tool: list_files]_

_[tool: list_files]_

Design system project is empty — nothing to inherit, so I'll establish the visual direction myself. A few decisions first:

_[tool: ask_user]_

Waiting on your answers — mainly which screens to prioritise and whether you want it tappable.

## User

Answered — screens: Proactive disruption push + lock screen, Home dashboard (unified bus + train arrivals), Silver mode home, Crowd report flow (Waze-style), Rewards & points wallet, Google Calendar connect + synced tri…; deliverable: Tappable prototype; platform: No frame; audience: LTA / government pitch panel, Hackathon or competition judges; silver: Distinctly simplified layout

## Assistant

Design system project is empty, so I'll set the direction: near-black transit-ops palette, Archivo + JetBrains Mono, real LTA line colours, crowd semantics reserved to green/amber/red.

_[tool: dc_write]_

_[tool: ready_for_verification]_

**Onward** — a tappable prototype covering the 8 screens you picked. Start on the lock-screen alert and tap through: warning → reroute → dashboard.

Two things worth flagging:
- I added a **reroute screen** (Rush / Comfort / Silver with three live-scored routes) even though you didn't pick it — the push alert has no payoff without it, and it's the clearest demo of the crowd-dispersal argument for LTA.
- Silver mode is a separate light, high-contrast layout with 27px+ type and two one-tap destinations, per your "distinctly simplified" answer.

Live arrival counters tick in real time, and the forecast map's hour scrubber changes predicted station loads. Say the word if you want a route-comparison screen for non-disruption planning, or an LTA-side ops view for the pitch.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Contrast fixed — inactive tab labels now `#7E8B9D` and all small secondary text `#8593A6`, both clearing 4.5:1 on the dark surfaces.

## User

I want you to design desktop UI, not just for mobile views

## Assistant

Design system project is still empty, so I'm carrying the same palette and type forward. Building the desktop web app as a companion file.

_[tool: dc_write]_

_[tool: dc_html_str_replace]_

## User

Can you pls change it using solvik design system?

## Assistant

_[tool: update_todos]_

Solvik is now attached — it flips both files from the dark palette to warm paper (`#f4f3f1`), white 26px cards, one green (`#437858`), pill controls and the floating nav. That's a full re-skin of both screens, so I've queued it as four steps above rather than start it half-way.

**Heads up: you're at 96% of your usage quota.** Both current files render cleanly, so this is a safe place to pause. Say the word and I'll start with the mobile app, then the desktop surface (which Solvik lists as a known gap — I'd extend its tokens to a two-column web layout rather than invent new ones).

## User

go ahead now it's reset alrdy

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Tokens and component APIs read. Rewriting both files on Solvik — warm paper, one green, crowding as words not percentages, no invented line colours.

_[tool: dc_write]_

_[tool: show_html]_

_[tool: show_html]_

DS components mount correctly. Now the desktop surface.

_[tool: dc_write]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Both files rebuilt on Solvik — composed from its real components (`AppHeader`, `Card`, `ArrivalRow`, `CrowdingMeter`, `TripCard`, `PromptCard`, `ServiceStatus`, `TabBar`, `SegmentedTabs`, `Button`, `Badge`, `Tag`), not restyled HTML.

Three judgement calls worth your eye:

- **Crowding is words now, not percentages** — Light / Moderate / Busy via `CrowdingMeter`, per Solvik's rule. The MRT line colours are gone too; line codes are `Badge` tones instead, since the system forbids colours outside its palette.
- **Copy rewritten to Solvik's voice** — imperative, no "we", no exclamation marks. "Pull meetings in, get leave-by nudges", "Start trip", "Report is live".
- **Desktop is an extension, not an observed surface** — Solvik lists web as a known gap, so I kept every token and component and only changed the shell: a sticky left rail and two content columns instead of the 440px canvas and floating nav. Worth flagging to whoever owns the system.

Mobile nav has four tabs (Live, Plan, Report, Points) where Solvik ships three — say the word if you'd rather fold Report and Points into Plan.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Fixed in both files: `--radius-lg` and `--radius-xs` replace the invented radius names, and the setup row value now composes `--size-subheading` properly. The desktop annotation subtitle drops to its own line at narrow widths.

## User

Apply drawing

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Line badges now carry the official LTA colours — NSL red, EWL green, NEL purple, CCL orange, DTL blue, TEL brown, buses in ink. Applied on arrivals, route legs and the active trip.

Two notes: CCL orange gets ink text rather than white, since white on it fails contrast. And this is a deliberate break from Solvik's one-green rule — worth flagging if the system owner reviews it. Say the word and I'll mirror it on the desktop file.

## User

Apply drawing

## Assistant

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Arrivals now read "1 **min**" with the unit beside the numeral, and two following times stacked underneath — "then 6 min" / "and 11 min".

That meant hand-building the arrival row instead of using Solvik's `ArrivalRow`, which deliberately drops the unit and puts only one following time alongside. The destination type and `CrowdingMeter` are unchanged, so it still matches — but it's a second documented deviation, alongside the LTA line colours.

## User

Apply drawing

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Dropped the "then" / "and" — following arrivals are now just "4 min" and "9 min".

## User

I want to add a feature "interactive maps" using OneMap, where the user can find any locations in Singapore, not just MRT stations, postal codes and bus stops. And then it will show the user different types of ways to get to destination. Users can choose modes, "Budget", "Fastest" and "Step-free" and "Less-crowded". It will show how many minutes to get there.

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Solvik ships a `MapCanvas` but it's hardcoded to OSM tiles — I'll fork it to OneMap so the basemap is the real SLA one.

_[tool: write_file]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: run_script]_

_[tool: multi_screenshot]_

_[tool: multi_screenshot]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: str_replace_edit]_

_[tool: web_search]_

_[tool: snip]_

_[tool: ready_for_verification]_

Added a **Map** screen (now the first tab): search any Singapore address, postal code, bus stop or station, pick a result, and the OneMap basemap draws the route with your origin and destination pinned.

Four routing modes — Fastest, Budget, Step-free, Less crowded — each with three options showing minutes, arrival time, fare, walking distance, the legs in LTA line colours, and predicted crowding. Switching mode redraws the route on the map.

Two notes: Solvik's `MapCanvas` is hardcoded to OpenStreetMap, so I forked it to OneMap tiles (`onemap-canvas.jsx`) and kept the system's warm filter and dotted green route. OneMap's terms require their logo and attribution — I've put a text credit under the map, but you'll want the actual OneMap logo there before this ships.

## User

Map should be the main page and it should cover the full device view. there will be a nav bar on the map at the bottom

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: ready_for_verification]_

Map is now the landing screen and runs full-bleed edge to edge. The search field floats over it at the top, results drop below it, and the nav bar sits over the map at the bottom. Picking a destination raises Solvik's `BottomSheet` with the four routing modes and options, above the nav.

The status bar is now dark type directly on the map rather than a white band — the header band would have broken the full-bleed view.

## User

Apply drawing

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Results now appear only when the search field is focused or has text in it — the map opens clean. Blur closes it after a short delay so taps on a result still land.

## User

Check didn’t complete

## Assistant

