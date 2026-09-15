// Server-side OneMap calls. Search is unauthenticated; routing needs the
// bearer token handled by onemapAuth.js.
import { getOneMapToken } from "./onemapAuth.js";

const SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search";
const ROUTE_URL = "https://www.onemap.gov.sg/api/public/routingsvc/route";

export async function oneMapSearch(query) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("searchVal", query);
  url.searchParams.set("returnGeom", "Y");
  url.searchParams.set("getAddrDetails", "Y");
  url.searchParams.set("pageNum", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OneMap search failed (${res.status})`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.BUILDING && r.BUILDING !== "NIL" ? r.BUILDING : r.SEARCHVAL,
    searchval: r.SEARCHVAL,
    address: r.ADDRESS,
    postal: r.POSTAL !== "NIL" ? r.POSTAL : null,
    lat: Number(r.LATITUDE),
    lng: Number(r.LONGITUDE),
  }));
}

// start/end are "lat,lng" strings. Extra params vary by route type.
export async function oneMapRoute({ start, end, routeType = "pt", mode = "TRANSIT", date, time, maxWalkDistance = 1000, numItineraries = 3 }) {
  const token = await getOneMapToken();
  const now = new Date();
  const url = new URL(ROUTE_URL);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("routeType", routeType);
  if (routeType === "pt") {
    url.searchParams.set("date", date || now.toISOString().slice(0, 10));
    url.searchParams.set("time", time || now.toTimeString().slice(0, 8));
    url.searchParams.set("mode", mode);
    url.searchParams.set("maxWalkDistance", String(maxWalkDistance));
    url.searchParams.set("numItineraries", String(numItineraries));
    // The turn-by-turn lane diagram needs the stops between board and alight.
    url.searchParams.set("showIntermediateStops", "true");
  }

  const res = await fetch(url.toString(), { headers: { Authorization: token } });
  const data = await res.json();
  if (!res.ok) throw new Error(`OneMap routing failed (${res.status})`);
  return data;
}
