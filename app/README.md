# Solvik

Solvik is a Singapore transit companion: a live OneMap-based map with
crowding zones, multi-mode trip planning (Fastest / Cheapest / Less crowded /
Step-free / Fewest changes / Least walking / Bike + rail), turn-by-turn
navigation, crowdsourced fault reporting, a points wallet, and calendar-aware
commute planning. This is the mobile build, implemented from the
`Onward.dc.html` Claude Design handoff (Solvik design system).

## Stack

- **React + Vite** — single-page app, no server-rendering.
- **Leaflet + OneMap tiles** — the map surface (`src/components/OneMapCanvas.jsx`), falling back to OpenStreetMap tiles if OneMap tiles fail to load.
- **`lucide`** for icons, matching the design system's icon set.
- **`api/*.js`** — small serverless functions (Vercel Node runtime) that proxy OneMap and LTA DataMall so their credentials never reach the browser. `npm run dev` runs these locally too (see `vite.config.js`), so the app is fully functional without deploying anywhere.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. The app works immediately with illustrative
(mock) data — no keys required to explore the UI.

## Wiring up real data

Copy `.env.example` to `.env` and fill in:

- **OneMap** — place search works with no credentials. Public-transport
  routing needs an authenticated token: register a free account at
  <https://www.onemap.gov.sg/apidocs/register> and set `ONEMAP_EMAIL` +
  `ONEMAP_PASSWORD` (the server exchanges these for a token automatically and
  caches it), or set `ONEMAP_TOKEN` directly if you already have one.
- **LTA DataMall** — request a free `AccountKey` at
  <https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html> and
  set `LTA_ACCOUNT_KEY`. This currently powers the live train service alerts
  shown in the map's Alerts sheet.

The locate button uses the browser's own geolocation, which needs no keys but
does require a secure context — it works on `localhost` and on the deployed
HTTPS URL, but not over a plain-HTTP LAN address.

Restart `npm run dev` after editing `.env`. Every live call is wrapped to
fall back to the illustrative data if a key is missing, the request fails,
or the API rate-limits — so the app never breaks because of a live-data
outage, it just quietly falls back.

### What's live vs. illustrative today

| Feature | Data source |
| --- | --- |
| Place search (map search, add-commute, places sheet) | Live OneMap search when reachable, else the built-in place list |
| Route line drawn on the map | Live OneMap public-transport routing when reachable, else a synthetic curve |
| Train service alerts (map Alerts sheet) | Live LTA DataMall `TrainServiceAlerts` when reachable, else illustrative faults |
| Your position + trip origin (locate button) | Live browser geolocation; falls back to the demo Yishun origin if denied or unavailable |
| Report tab's nearest stop | Live LTA DataMall `BusStops` via `/api/nearest-stop`, else the illustrative Bishan stop |
| Trip time/fare/crowding estimates, area crowding zones, points, reports | Illustrative — LTA DataMall doesn't expose a general geographic crowding feed or full point-to-point trip-planning-with-fares API, so these stay as realistic placeholder data. Swap in your own backend here if you have one. |

## Project layout

```
src/
  design-system/   Solvik design-system primitives (Button, Card, Tag, ...)
  screens/         One file per app screen (Intro, Map, Nav, Report, Points, Plan)
  state/appLogic.jsx  All app state + behavior, ported from the prototype's view-model
  components/      OneMapCanvas (Leaflet + OneMap tiles)
  api/             Client wrappers for /api/*
  lib/             Small helpers (CSS-text-to-style-object, polyline decoding)
  tokens/          Design tokens (colors, type, spacing, radius, motion)
api/               Serverless functions: OneMap search/routing, LTA DataMall proxy
```

## Deploying

Any static host that also runs the `api/` functions as serverless endpoints
works — this was built with Vercel in mind (`vercel deploy`, zero extra
config). Set the environment variables from `.env.example` in your host's
project settings before deploying.

## Notes on the build

- The bottom tab bar is icon-only, per the mobile build spec (no text labels
  under Map / Plan / Report / Points).
- The JS bundle currently includes the full `lucide` icon set (~250KB
  gzipped) since icon names are chosen dynamically at runtime; swap to a
  fixed icon import map if bundle size becomes a concern.
