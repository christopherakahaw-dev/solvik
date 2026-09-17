# Solvik

**A Singapore transit companion that tells you when to leave, warns you before
the crush, and never makes a number up.**

Live: <https://app-three-eta-97.vercel.app/> · Source for the app itself:
[`app/`](app) · Full technical notes: [`app/README.md`](app/README.md)

Plan a journey on a live map, see every leg of it — how far you walk,
where you board, how many stops you ride, when the next bus actually leaves —
then follow it turn by turn. Solvik learns the trips you repeat, works out when
you need to leave, and tells you when a station on your way is forecast to be
crowded at the time you'd be standing in it.

## What makes it different

**It never invents data.** Every figure comes from OneMap or LTA DataMall. When
a feed is missing, slow or silent, the app says which one and why — "No 410
arrivals right now", "LTA publishes no crowd forecast for the stations on this
trip" — instead of showing a plausible number. The only sample data left is the
voucher catalogue, labelled *Sample data* on screen; everything else, down to
"reported by 4 commuters", is counted from something real.

**The crowd warning is a join, not a prediction.** LTA publishes a same-day
forecast in 30-minute intervals per station. Solvik plans your journey, works
out which interval you'd reach each station in, and reads it. No model, no
training data, no "risk engine" — and never a claim finer than the feed's own
resolution: *"Busy at Bishan from 08:30"*, never *"in 15 minutes"*.

**It learns your commutes from trips you actually took.** Start the same route a
few mornings running and it appears on the Today tab by itself, with the
evidence that justified it and an Undo. Four or more journeys, three of them
finished, consistent days, a 45-minute time spread, seen in the last three
weeks — a deliberately high bar, because a wrong commute means wrong alerts. It
un-learns on the same evidence: stop making the trip and the commute retires
itself after five weeks, and says so, because an inference should be no more
durable than what supports it.

**Planned works, not just faults.** LTA publishes adhoc lift maintenance per
station. Solvik raises one only when it falls on a station you actually board,
alight or change at — and if your commute is set to Step-free, the same row
stops being a footnote and becomes a blocked journey, said in those words.
Routing around it avoids the station, not the line, because a lift being out is
no reason to write off every train on it.

**When your line breaks, it finds you another way.** An alert naming a line you
ride becomes a route that avoids it — OneMap has no way to exclude a line, so
Solvik asks for more itineraries than it needs and drops the ones still running
through the fault. If every route still uses it, the app says so rather than
showing one through the disruption, and the alternative's time is labelled as
what it is: a timetable that doesn't know anything is wrong.

**Reports are checked before they count, and rewarded only when corroborated.**
A report needs a photo taken through the camera then and there — there is no
file picker to choose an older one from. The server checks where you are, how
precise that is, when the shutter fired, and asks Claude whether the photo is
*consistent* with what you reported. Nothing is ever labelled **verified**,
because consistency is not truth. Points are credited only when a second
commuter reports the same thing or LTA's own feed confirms it, so filing alone
earns nothing. The photo is checked and discarded — it is never stored.

**What it learns about your movements stays on your device.** Only deliberate
actions are recorded — a route you started, a destination you chose — never a
background trace of where your phone has been. That journey history, and the
commutes and places inferred from it, are held in the browser and sent to no
endpoint: there is no journeys table to sync them to. Trips older than 90 days
fall away on their own, and one tap forgets all of it. Saved places, watched
commutes and preferences do sync, to your own account, if you make one — and a
report you file deliberately sends its station, coordinates and your account id,
which is the one thing here that is meant to leave the device. Your API
keys stay server-side and never reach the browser.

## Try it

```bash
cd app
npm install
npm run dev
```

Add `ONEMAP_EMAIL` + `ONEMAP_PASSWORD` (or `ONEMAP_TOKEN`) and
`LTA_ACCOUNT_KEY` to `app/.env` — both free, see
[`app/.env.example`](app/.env.example). Without them the UI loads and reports
every panel as unavailable, which is the honest behaviour rather than a
fallback.

**Set `VITE_MAPTILER_KEY`** ([free, no card](https://cloud.maptiler.com/account/keys/)).
OpenStreetMap is the map base and its tile policy forbids applications from
using `tile.openstreetmap.org`, so OSM is served through MapTiler. Without the
key the map still works, falling back to OneMap's own tiles — but those are the
Singapore Land Authority's national map, not OpenStreetMap.

Accounts use Supabase. Add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`, then apply the migration in
`app/supabase/migrations`. Account deletion additionally needs the server-only
`SUPABASE_SERVICE_ROLE_KEY`; see [`app/README.md`](app/README.md) for the full
setup.

## What's live

| | Source |
| --- | --- |
| Journey options, legs, fares, geometry, turn-by-turn steps | OneMap public-transport routing |
| Next bus times per bus leg, refreshed every 30 s | LTA bus arrivals |
| Station crowding, now and forecast, and the "Less crowded" ranking | LTA platform crowd density |
| Service alerts, matched to the lines you use | LTA train service alerts |
| Nearest stop for a report | LTA bus stops |
| Where you are, and progress along the route | Browser geolocation |
| Commuter reports, their corroboration counts, and your points | Reports filed by people using the app, checked before they count |
| Vouchers | **Sample data** — nothing issues a real one |

## How it's built

React + Vite, no framework beyond that. The map is Leaflet over OpenStreetMap,
served through MapTiler, falling back to OneMap's own tiles if it fails.

Fifteen serverless functions in [`app/api/`](app/api) hold the credentials and do
the joining work — ranking journeys, attaching crowd levels and bus arrivals to
the legs that need them, resolving station codes to positions. The browser only
ever talks to those. `npm run dev` runs them locally too, so the whole thing
works without deploying anywhere.

The interesting logic is pulled out into pure modules that can be tested without
a browser: `outlook.js` (journey × forecast → when to leave), `patterns.js`
(journeys → a commute), `navProgress.js` (GPS → how far along you are),
`tripDetail.js` (an itinerary → the step-by-step card), `persona.js` (who is
reading → what changes), `lines.js` (the line-code canon the brief warns about).
**216 tests** run against recorded API responses, so every parser is checked
without touching the network, plus 31 in a real browser.

Two diagnostics ship with it, both safe to paste into an issue because neither
prints a secret: `/api/diagnostics` reports exactly what OneMap did with a
routing request, and `/api/coverage` reports how much of the network LTA's crowd
feed covers — separating LTA's gaps from our own, which is how a bug that lost
218 of 224 stations got found.

## What it doesn't do

Named here rather than left to be discovered:

- **No real vouchers.** Points are counted from reports you actually filed and
  that someone else corroborated, but nothing issues or redeems an EZ-Link
  top-up, so the catalogue is illustrative and labelled as such on screen.
- **No claim that a report is true.** The photo check establishes consistency;
  the counts establish agreement; LTA's feed confirms or doesn't. Nothing in the
  app is labelled *verified*, because none of those three is proof.
- **No reporting without a camera.** Camera-only capture is the point, so a
  desktop with no camera says it cannot file a report rather than offering a
  file picker.
- **No alerts while the app is closed.** A web page can't be woken without a
  push subscription server; the app says so rather than implying a push that
  won't arrive.
- **No train arrival times.** DataMall publishes crowding for rail, not
  timings, so rail legs show how busy the platform is instead of a countdown.
- **Singapore only**, by design — it is built on two Singapore data sources.

## Repository

```
app/        the application: React front end, serverless API, tests
project/    the original HTML design prototypes
chats/      the design conversations they came out of
```

Solvik was designed in [Claude Design](https://claude.ai/design) as an HTML
prototype, then implemented for real against live transit APIs — the prototypes
and the conversations behind them are kept here so the path from design to
working app is legible.
