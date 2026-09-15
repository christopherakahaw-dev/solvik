// Server-side OneMap calls. Search is unauthenticated; routing needs the
// token handled by onemapAuth.js.
import { getOneMapToken } from "./onemapAuth.js";

const SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search";
const ROUTE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route";

// Reads the body once as text, then tries JSON. Checking res.ok before parsing
// means an HTML or empty error body reports its real status instead of dying
// in the JSON parser.
async function readBody(res) {
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Left null; callers fall back to the raw text.
  }
  return { text, json };
}

function upstreamError(label, res, body) {
  const detail = (body.json && (body.json.error || body.json.message)) || body.text.trim().split("\n")[0] || "";
  const err = new Error(`${label} failed (${res.status})${detail ? `: ${String(detail).slice(0, 200)}` : ""}`);
  err.status = res.status;
  return err;
}

export async function oneMapSearch(query) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("searchVal", query);
  url.searchParams.set("returnGeom", "Y");
  url.searchParams.set("getAddrDetails", "Y");
  url.searchParams.set("pageNum", "1");

  const res = await fetch(url.toString());
  const body = await readBody(res);
  if (!res.ok) throw upstreamError("OneMap search", res, body);

  return ((body.json && body.json.results) || []).map((r) => ({
    name: r.BUILDING && r.BUILDING !== "NIL" ? r.BUILDING : r.SEARCHVAL,
    searchval: r.SEARCHVAL,
    address: r.ADDRESS,
    postal: r.POSTAL !== "NIL" ? r.POSTAL : null,
    lat: Number(r.LATITUDE),
    lng: Number(r.LONGITUDE),
  }));
}

export function buildRouteUrl({ start, end, routeType = "pt", mode = "transit", date, time, maxWalkDistance = 1000, numItineraries = 3 }) {
  const url = new URL(ROUTE_URL);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("routeType", routeType);
  if (routeType === "pt") {
    if (!date || !time) throw new Error("OneMap routing requires a date and time");
    if (!["transit", "bus", "rail"].includes(String(mode).toLowerCase())) {
      throw new Error("OneMap routing requires mode transit, bus, or rail");
    }
    url.searchParams.set("date", date);
    url.searchParams.set("time", time);
    url.searchParams.set("mode", String(mode).toLowerCase());
    url.searchParams.set("maxWalkDistance", String(maxWalkDistance));
    url.searchParams.set("numItineraries", String(numItineraries));
    // The turn-by-turn lane diagram needs the stops between board and alight.
    url.searchParams.set("showIntermediateStops", "true");
  }
  return url;
}

// OneMap answers "trip not possible" with HTTP 200 and an OTP-style error
// object, so a 200 is not on its own a success.
export function otpError(json) {
  if (!json || !json.error) return null;
  const e = json.error;
  const msg = typeof e === "string" ? e : e.msg || e.message || "";
  const id = typeof e === "object" && e ? e.id : null;
  return { id, msg: msg || "OneMap could not plan this trip" };
}

// start/end are "lat,lng" strings. Extra params vary by route type.
export async function oneMapRoute(params) {
  const url = buildRouteUrl(params);

  // The docs and community examples disagree on whether the token is sent bare
  // or as a Bearer credential, and an expired token has to be replaced rather
  // than retried — so each of those gets exactly one retry.
  const attempts = [
    { force: false, bearer: false },
    { force: false, bearer: true },
    { force: true, bearer: false },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    const token = await getOneMapToken({ force: attempt.force });
    const res = await fetch(url.toString(), {
      headers: { Authorization: attempt.bearer ? `Bearer ${token}` : token },
    });
    const body = await readBody(res);

    if (res.ok) {
      const err = otpError(body.json);
      if (err) {
        const e = new Error(err.msg);
        e.otpErrorId = err.id;
        throw e;
      }
      return body.json || {};
    }

    lastError = upstreamError("OneMap routing", res, body);
    if (res.status !== 401 && res.status !== 403) throw lastError;
  }
  throw lastError;
}
