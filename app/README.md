# Solvik

Solvik is a Singapore transit companion: a live OneMap-based map with
live station crowding, multi-mode trip planning (Fastest / Cheapest / Less
crowded / Step-free / Fewest changes / Least walking / Bike + rail),
turn-by-turn navigation, fault reporting and a points wallet. This is the
mobile build, implemented from the `Onward.dc.html` Claude Design handoff
(Solvik design system).

## Stack

- **React + Vite** — single-page app, no server-rendering.
- **Leaflet + OneMap tiles** — the map surface (`src/components/OneMapCanvas.jsx`), falling back to OpenStreetMap tiles if OneMap tiles fail to load.
- **`lucide`** for icons, matching the design system's icon set.
- **`api/*.js`** — small serverless functions (Vercel Node runtime) that proxy OneMap and LTA DataMall so their credentials never reach the browser, and do the joining work (journey ranking, crowd density to station coordinates) server-side. `npm run dev` runs these locally too (see `vite.config.js`), so the app is fully functional without deploying anywhere.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. Without keys the UI loads but transit data will
show as unavailable — see below.

## Wiring up real data

Copy `.env.example` to `.env` and fill in:

- **OneMap** — place search works with no credentials. Public-transport
  routing needs an authenticated token: register a free account at
  <https://www.onemap.gov.sg/apidocs/register> and set `ONEMAP_EMAIL` +
  `ONEMAP_PASSWORD` (the server exchanges these for a token automatically and
  caches it), or set `ONEMAP_TOKEN` directly if you already have one.
- **LTA DataMall** — request a free `AccountKey` at
  <https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html> and
  set `LTA_ACCOUNT_KEY`. This powers station crowding, bus loading, service
  alerts and the nearest-stop lookup.

The locate button uses the browser's own geolocation, which needs no keys but
does require a secure context — it works on `localhost` and on the deployed
HTTPS URL, but not over a plain-HTTP LAN address.

The map's **From / To** planner can route between any two OneMap places. The
starting point can be searched directly, selected from a verified Home, Work or
School shortcut, or set to the device location with an explicit tap. A searched
starting point is kept only for the current session; it is not added to saved
places automatically.

### How position tracking behaves

Solvik does not request location during onboarding, when the map first opens, or
when the user searches for a destination. The map asks for a one-off fix only
when the user taps **My location** or its locate button, and the Report tab asks
only when the user chooses to find their nearest stop. Continuous tracking
starts only after the user begins turn-by-turn navigation. While a trip is under
way, progress along the route drives the countdown and the current step — and
only fixes worth believing move it:

- a fix vaguer than ~150 m is ignored;
- a fix more than ~250 m from the route line counts as off-route, and progress
  holds where it was instead of guessing;
- after the first one, a fix is only matched within reach of the last known
  progress, at up to 35 m/s, so a route that doubles back can't jump the reading;
- progress never runs backwards, so GPS wander can't rewind the ETA;
- distance is converted to time per leg, so half the metres of a trip isn't read
  as half its minutes when one leg walks and the next takes a train.

Until a fix has placed you on the route, the timetable drives the screen and
says so. Once your position leads, the clock never silently takes over again:
losing GPS holds the last reading and shows that instead.

Restart `npm run dev` after editing `.env`. **Both keys are needed for the
app to be useful**: without them, search, journey planning, crowding and
alerts all report that they're unavailable rather than showing stand-in data.

### What's live vs. sample

Everything that LTA DataMall or OneMap can supply is fetched live. When a key
is missing or a call fails, the app says so — it never quietly substitutes
invented data.

| Feature | Source |
| --- | --- |
| Place search (map, add-commute, places sheet) | OneMap search |
| Journey options: duration, arrival, fare, legs, transfers, walking | OneMap public-transport routing |
| Route line on the map | The chosen itinerary's own geometry |
| Turn-by-turn steps and stop sequences | The same itinerary's legs and intermediate stops |
| Step-by-step breakdown on a route card | The itinerary's own legs: walk distance and time, stop counts, boarding and alighting stops |
| Today tab: leave-by time, crowd outlook, alternatives | Your watched commute, planned by OneMap, joined to LTA's published crowd forecast for the stations it passes |
| Next bus times per bus leg | LTA bus arrivals, re-asked every 30 s while the route sheet is open |
| Crowding circles per MRT station + time scrubber | LTA platform crowd density, real-time and same-day forecast |
| "Less crowded" ranking | LTA crowd density (rail) and bus loading |
| Service alerts | LTA train service alerts |
| Nearest stop for reports | LTA bus stops, via `/api/nearest-stop` |
| Your position | Browser geolocation, only after an explicit location action or during navigation |
| Trip origin | A searched OneMap place, a verified saved place, or an already-authorised device position |
| Your places, watched commutes, recent destinations and read alerts | Your own input, saved in the browser |
| **Points, vouchers, nearby-reports feed** | **Sample data** — an account/social service, which neither API provides. Labelled as such in the UI. |

### The Today tab (leave-by and the crowd outlook)

A watched commute is planned as a real journey, and each rail station on the way
is looked up in LTA's **same-day** crowd forecast at the interval you would
actually be there — so "Busy at Bishan from 08:30" is a join, not a prediction.
Nothing here is modelled or estimated:

- the forecast is published in **30-minute intervals**, and the app never phrases
  a warning more precisely than that;
- a station LTA doesn't publish is reported as uncovered ("forecast for 2 of 4
  stations on the way"), never as quiet;
- a trip outside the published day says the forecast doesn't reach that far yet;
- bus legs aren't counted as gaps: buses have live vehicle loading instead of a
  stop forecast, which is what the route card shows.

Commutes can be anchored to **Leave at** or **Arrive by**; with an arrive-by, the
leave time comes from the journey's own duration plus a small buffer, and the
card says when leaving earlier or later lands you in a quieter interval.
"Alert me" schedules a real browser notification — but only while Solvik is open
in a tab, which is what the app tells you when you set it.

Your saved places are geocoded through OneMap when you type them, because a
commute with no coordinates can't be routed. A place that can't be found says so
in the Your places sheet instead of failing silently.

Trains have no arrival feed — DataMall publishes crowding for rail, not
timings — so a rail leg shows how busy the platform is rather than a countdown.
Where bus times are missing, the card says which kind of missing it is (no key,
unknown stop, nothing running) instead of leaving a gap.

### What Solvik learns, and how to stop it

Start a route a few times and the commute appears on the Today tab on its own,
with the evidence that justified it and an **Undo**. There is no model and no
training data behind this: journeys whose two ends are both within ~400 m group
together, and a group becomes a commute only when it passes every one of these —

- 4 or more journeys, at least 3 of them actually finished (tapping Go is not
  travelling);
- on 2 or more distinct dates of the same kind of day (weekday and weekend
  versions of a route stay separate);
- departure times within a 45-minute spread, measured so one late night out
  can't disqualify a routine;
- seen in the last 21 days.

Only deliberate actions are recorded — a route you started, a destination you
chose — never a background trace of where the device has been. Everything stays
in the browser: no endpoint in `api/` receives any of it. Trips older than 90
days fall away on their own, **Undo** makes a pattern stay gone however many
more times it is seen, and **Forget everything** in the Today tab clears the
journeys, the patterns and the commutes learned from them in one tap.

Disruptions are matched against the lines those journeys actually used, so an
alert on a line you never take stays in the Alerts sheet instead of interrupting
you. On the first run the current alerts are noted as a baseline rather than
announced, and reopening the app shows what is new since you last looked. As
with the leave-time reminder, this only runs while Solvik is open.

To try it without waiting a week, seed the journeys from the browser console —
four weekday mornings between two points is enough:

```js
localStorage.setItem("solvik:journeys", JSON.stringify(
  [1, 2, 3, 4].map((n) => {
    const d = new Date(); d.setDate(d.getDate() - n); d.setHours(8, 5 + n, 0, 0);
    return { id: "s" + n, at: d.getTime(), fromLL: [1.4294, 103.835], fromName: "Yishun",
             toLL: [1.3009, 103.8559], toName: "Raffles Place", mode: "Comfort",
             legs: ["NSL"], started: true, completed: true };
  })
));
location.reload();
```

(Pick days that are actually weekdays — a Sunday trip forms a weekend pattern,
which is kept separate on purpose.)

### Saved-place privacy

Home, Work, School, route preferences, watched commutes and recent destinations
are stored only in the current browser. OneMap receives search text while the
user searches and the coordinates needed for a route the user requests; searched
route origins are not persisted, and these private API responses are not
shared-cacheable. Choosing a destination never triggers location permission on
its own. The Plan screen lets the user hide saved-place markers, remove
individual places, or erase all Solvik data from the device. Solvik ships
without analytics or telemetry.

Ranking caveats worth knowing: "Step-free" prefers wheelchair-accessible
buses and short walks but cannot guarantee lift availability; "Bike + rail"
returns a cycling route end to end rather than a true multimodal one. Each
mode's blurb in the app states what it actually ranks on.

## Project layout

```
src/
  design-system/   Solvik design-system primitives (Button, Card, Tag, ...)
  screens/         One file per app screen (Intro, Map, Nav, Report, Points, Plan)
  state/appLogic.jsx  All app state + behavior, ported from the prototype's view-model
  components/      OneMapCanvas (Leaflet + OneMap tiles)
  api/             Client wrappers for /api/*
  lib/             Small helpers (geolocation, geometry, polyline, style text)
  tokens/          Design tokens (colors, type, spacing, radius, motion)
test/              Fixture-based tests for the API response parsers
api/               Serverless functions: journey options, live bus arrivals,
                   crowding, per-station forecast, coverage probe, nearest stop,
                   OneMap search/routing and the LTA DataMall proxy
api/_lib/          Shared server helpers (LTA fetch, OneMap calls, station
                   directory, itinerary → UI mapping)
```

## Deploying

Any static host that also runs the `api/` functions as serverless endpoints
works — this was built with Vercel in mind (`vercel deploy`, zero extra
config). Set the environment variables from `.env.example` in your host's
project settings before deploying.

## Diagnosing live-data problems

Two ways, both reporting the same thing: which credential path was used,
whether the token is valid and when it expires, the exact request sent to
OneMap, the HTTP status, how many itineraries survived parsing, and whether LTA
DataMall answers. Tokens, passwords and account keys are never included, so the
output is safe to paste into an issue.

**In the browser** — with the app running, open:

```
http://localhost:5173/api/diagnostics
```

(or `/api/diagnostics` on your deployed URL). Add `?from=1.43,103.83&to=1.30,103.85`
to test a specific pair. Each response ends with a `hint` field in plain
English saying what to fix.

**In a terminal** — from the `app/` directory, not the repo root:

```bash
cd app
npm run diagnose
npm run diagnose -- --from 1.4294,103.8350 --to 1.3009,103.8559
npm run diagnose -- --coverage
```

`--coverage` (also at `/api/coverage`) answers a different question: how many
stations LTA's crowd feed actually publishes, per line, and how many of those
*we* then fail to place on the map. `resolveStations()` drops any code it can't
match through OneMap search, so without this the two kinds of gap are
indistinguishable — and only one of them is fixable here.

The endpoint exposes only status information, never secret values, but it does
reveal which keys are configured — remove `api/diagnostics.js` before a public
launch if that bothers you.

## Tests

```bash
npm test
```

Covers the mapping from each upstream response shape to what the UI renders
(itinerary → option card, itinerary → turn-by-turn steps, crowd codes →
levels, position → progress along the route), using recorded fixtures so the
parsers can be checked without network access.

## Notes on the build

- The bottom tab bar is icon-only, per the mobile build spec (no text labels
  under Map / Plan / Report / Points).
- The JS bundle currently includes the full `lucide` icon set (~250KB
  gzipped) since icon names are chosen dynamically at runtime; swap to a
  fixed icon import map if bundle size becomes a concern.
