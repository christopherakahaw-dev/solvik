# Solvik — PS2 write-up

**A Singapore transit companion that tells you when to leave, warns you before
the crush, and never makes a number up.**

Live: <https://app-three-eta-97.vercel.app/> · Setup: [`README.md`](README.md) ·
Technical detail: [`app/README.md`](app/README.md)

---

## 1. Who it is for

**All three personas are supported, and the app says which one you are.** The
Today tab carries a picker — *Fixed schedule*, *Flexible and multi-modal*,
*Step-free access* — and it is read out of what onboarding already asks, so
nobody answers the same question twice. It follows the account, not the device.

That is not hedging. The same LTA row genuinely produces different advice:

| | Rachel (fixed) | Arjun (flexible) | Mdm Lim (step-free) |
| --- | --- | --- | --- |
| Lift out at your interchange | a note | a note | **a blocked journey** |
| Six-minute delay | ignored | told | told |
| Rain on the walking leg | route unchanged | route changes | route changes |
| Crowded platform | quieter carriage | quieter carriage | step-free first |

**The demo walks Mdm Lim end to end**, because hers is the journey the app
serves best and the brief calls `FacilitiesMaintenance` "essential" to her.
Spreading a five-minute demo across three personas would show none of them.

## 2. The four scored words

**Proactive.** The crowd forecast is published in 30-minute intervals for the
whole day, so the app can tell you at 07:30 that your 08:15 platform will be
busy. Weather does the same for the walking legs. Lift maintenance and bus-route
changes are known before they bite.

**Decision support.** When a line you ride is disrupted, the card leads with
what LTA has *already activated* — free bus boarding, a free shuttle, and where.
That is quoted from `AffectedSegments`, not inferred. Below it sits an
alternative we computed, with its time difference and an honest caveat.

**Planned and unplanned.** Faults come from `TrainServiceAlerts`. Scheduled
events come from `v2/FacilitiesMaintenance` (lifts, per exit), `RoadWorks` and
`RoadOpenings`, and `PlannedBusRoutes` — the last of which publishes changes
*before* their effective date, so the card gives the date.

**Tailored.** Section 1 above.

## 3. Architecture

React + Vite, mobile-first, no framework beyond that. Leaflet renders
**OpenStreetMap** as the base, served through MapTiler because the OSM tile
policy prohibits application traffic on `tile.openstreetmap.org`. This needs
`VITE_MAPTILER_KEY` (free, no card, and read at build time so a host needs a
redeploy to pick it up); without it the map falls back to OneMap,
which renders Singapore well but is the Singapore Land Authority's own national
map rather than an OSM rendering — so the key is what makes OSM the base.

Each layer carries the credit actually owed: OSM's ODbL attribution on the OSM
base, OneMap and SLA on theirs.

**Fifteen endpoints** in `app/api/` hold every credential and do the joining
work — ranking journeys, attaching crowd levels and bus arrivals to the legs that
need them, resolving station codes to positions, triaging reports. The browser
talks only to those.

They ship as one serverless function, not fifteen. Vercel's free tier allows
twelve per deployment, so `api/[...path].js` dispatches on the first path
segment to handlers in `api/_handlers/` — a directory the underscore keeps out
of the function scan. Public URLs are unchanged, the handlers are loaded lazily
so a request pays only for its own route, and a test asserts the dispatch table
still matches the directory, since a route dropped from it would otherwise
surface as a 404 in production and nowhere else. `npm run dev` runs the same
dispatcher locally, so the whole app works without deploying.

The judgement lives in **pure modules** that run without a browser, each with its
own test file: `outlook.js` (journey × forecast → when to leave), `patterns.js`
(journeys → a commute), `navProgress.js` (GPS → progress along a route),
`confidence.js` (reports → how much belief they have earned), `persona.js` (who
is reading → what changes), `lines.js` (the line-code canon), `weather.js`,
`planned.js`, `roadConditions.js`, `baseline.js`, `avoid.js`.

Accounts and sync are Supabase, with row-level security on every table.

## 4. Data used, and what each one changes

| Source | What it changes for the commuter |
| --- | --- |
| OneMap routing | The journey itself, door to door, with the walking legs |
| `TrainServiceAlerts` | Which disruptions reach you, and the free bus/shuttle LTA activated |
| `PCDRealTime` / `PCDForecast` | "Busy at Bishan from 08:30" — and leaving earlier to miss it |
| `v3/BusArrival` | Next bus per leg, its load, and whether it is wheelchair-accessible |
| `v2/FacilitiesMaintenance` | A lift out at a station you board, alight or change at |
| `RoadWorks` / `RoadOpenings` | Works on the roads your bus legs use |
| `PlannedBusRoutes` | A route change, before it takes effect |
| `TrafficSpeedBands` / `TrafficIncidents` | Whether the roads are slow, and why |
| `PV/Train`, `PV/Bus` | Whether this crowd is unusual for this station at this hour |
| `BusStops` | The nearest stop to report from |
| data.gov.sg weather | Rain on your walking legs, before you leave |
| OpenStreetMap (via MapTiler) | The map base, as 3.2.2 requires |
| Rail station GeoJSON (provided) | `GRND_LEVEL` for the accessibility persona |

**Deliberately not used**, because judgement is scored and not just breadth:
`CarParkAvailabilityv2`, `BicycleParkingv2` and `FaultyTrafficLights` — none of
the three personas drives or parks, and a faulty traffic light does not change a
route choice. `Taxi-Availability` is shown only when no route avoids a
disruption, where "sit it out or take a taxi" is genuinely what is left.

## 5. Every number, and where it comes from

The brief says a claim a judge cannot check does not score. These are all of
them.

| Claim on screen | How it is arrived at |
| --- | --- |
| "Busy at Bishan from 08:30" | `PCDForecast` for that station, read at the 30-minute interval the journey reaches it. A join, not a prediction — and never phrased finer than the feed's own resolution. |
| "Leaving 20 min earlier would put you there while it's moderate" | The same forecast, re-read at shifted departure times (±10/20/30 min) in `outlook.js`. |
| "52 min · 14 min longer · avoids NSL entirely" | Two OneMap itineraries, differenced. The 52 is OneMap's **timetable**, which does not know about the disruption — the card says so. |
| "Reported by 4 commuters" | `count(distinct reporter)` over reports in the last 30 minutes, from the Supabase view. Distinct **accounts**, never submissions. |
| "Free bus boarding at Yishun, Khatib" | Quoted verbatim from `AffectedSegments.FreePublicBus`. Not computed, so no caveat. |
| "Your 12 min on foot will take about 4 min longer" | `walkSecs × 1.35` for heavy rain, `× 1.15` for showers. **These two multipliers are our own assumption, not measured** — see limitations. |
| "Bishan Road is congested (10–19 km/h)" | `TrafficSpeedBands` band 2, with the feed's own published speed range. Never converted into minutes. |
| "230 tests" | `npm test` in `app/`. 32 browser tests: `npx playwright test`. |
| Points in the wallet | Summed from reports you filed that were corroborated. The **vouchers are sample data** and labelled as such. |

## 6. Assumptions

- **The rain multipliers (1.35 / 1.15) are judgement, not measurement.** They are
  stated on screen as an adjustment rather than folded into an ETA, and they are
  in one place (`weather.js`) to be tuned.
- **A report's photo establishes consistency, not truth.** A model cannot tell a
  broken lift from a working one with a sign taped to it. Nothing in the app is
  labelled *verified*.
- **Distinct accounts approximate distinct people.** One person with two accounts
  could manufacture agreement; the rate limit and the LTA cross-check are what
  stand against that.
- **Station footprints in the provided GeoJSON carry no line codes**, so they are
  joined by name and only where the name is unambiguous.

## 7. Known limitations

- **No alerts while the app is closed.** A web page cannot be woken without a
  push subscription server, which is a backend of its own and would mean route
  data leaving the device. The app says this where the toggle lives rather than
  implying a push that will not arrive.
- **No train arrival times.** DataMall publishes rail crowding, not timings, so
  rail legs show how busy the platform is instead of a countdown.
- **Lift warnings are same-day, not the day before.** `FacilitiesMaintenance` is
  an *adhoc* feed; it does not publish a schedule ahead. Mdm Lim's brief asks for
  a day's notice and this is the one part of it we cannot currently meet.
- **Report counts will be small.** They are real — filed by people using the app
  — so on judging day expect "2 commuters", not "7".
- **`PCDForecast` has returned 500 for extended periods** during development.
  `ltaFetch` retries the endpoint's alternate spelling on 5xx, and the app says
  the forecast is unavailable rather than substituting live crowding for it.
- **Large text scales the type tokens, not hardcoded sizes.** Every size token
  runs through one factor, so the step-free persona grows the whole interface;
  a handful of inline literals in the denser screens still do not scale.

## 8. Reproducing anything here without a key

The submission rules require that a judge can check a claim without paying for
anything or waiting for a disruption to happen.

```bash
cd app && VITE_DEMO_MODE=1 npm run dev
```

With `LTA_ACCOUNT_KEY` unset, every LTA call fails and is answered from recorded
fixtures in `app/api/_lib/recorded/` — an NSL fault between Yishun and Bishan
with free bus boarding, lifts out at Bishan, road works on Bishan Road, a crowd
forecast, and rain over the north. **Everything served this way is marked
`recorded: true` and says "Recorded" on screen.** Nothing is ever passed off as
live; the point is that the disruption path can be walked on a quiet Tuesday.

## 9. Use of AI

Two places, both narrow, and one deliberate refusal.

**Report triage** sends a photo to Claude and asks one question: is this image
*consistent* with what was reported, and is it a photograph of a screen? That
second check catches the cheapest way to fake a report. It runs behind
deterministic gates — fresh fix, accurate fix, at the right place, shutter within
two minutes, under the hourly limit — which reject most bad input for free.

**It costs a judge nothing to see.** Demo mode answers from a recorded verdict
without calling the API at all, so the whole path — including a rejection — is
walkable with no key and no spend, which is what the submission rules require of
any claim. With no key configured the deterministic gates still run and the
report says plainly that the photo was not checked.

**Commute learning is deliberately not a model.** Grouping journeys by endpoint
and counting them is a few dozen lines, runs offline in milliseconds, is unit
tested, and means nobody's travel history goes to an inference endpoint. The
brief says a well-argued decision *not* to use a model is creditable; this is
ours.

Measurement: `npm test` covers both — the triage gates and parser in
`test/triage.test.mjs`, the learning bar in `test/patterns.test.mjs`, including
the cases that must *not* promote.
