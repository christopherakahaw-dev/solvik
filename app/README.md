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
| Crowding circles per MRT station + time scrubber | LTA platform crowd density, real-time and same-day forecast |
| "Less crowded" ranking | LTA crowd density (rail) and bus loading |
| Service alerts | LTA train service alerts |
| Nearest stop for reports | LTA bus stops, via `/api/nearest-stop` |
| Your position and trip origin | Browser geolocation |
| Your places and watched commutes | Your own input, saved in the browser |
| **Points, vouchers, nearby-reports feed** | **Sample data** — an account/social service, which neither API provides. Labelled as such in the UI. |

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
api/               Serverless functions: journey options, crowding, nearest stop,
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
```

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
