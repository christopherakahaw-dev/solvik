// Same checks as `npm run diagnose`, reachable from a browser while the app is
// running: open /api/diagnostics. Reports credential *status* and upstream
// responses only — never a token, password or account key — so the output is
// safe to paste into an issue.
import { credentialSummary, getOneMapToken } from "./_lib/onemapAuth.js";
import { buildRouteUrl, otpError } from "./_lib/onemap.js";
import { normalizeItinerary } from "./_lib/itinerary.js";
import { ltaKey, ltaFetch } from "./_lib/lta.js";

function singaporeNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  })
    .formatToParts(new Date())
    .reduce((out, p) => (p.type === "literal" ? out : { ...out, [p.type]: p.value }), {});
  return { date: `${parts.month}-${parts.day}-${parts.year}`, time: `${parts.hour}:${parts.minute}:${parts.second}` };
}

function tokenExpiry(token) {
  const payload = String(token).split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (!claims.exp) return null;
    const at = new Date(claims.exp * 1000);
    return { expiresAt: at.toISOString(), expired: at < new Date() };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const q = req.query ?? Object.fromEntries(new URL(req.url, "http://localhost").searchParams);
  const from = q.from || "1.4294,103.8350";
  const to = q.to || "1.3009,103.8559";

  const report = {
    checkedAt: new Date().toISOString(),
    credentials: { ...credentialSummary(), ltaAccountKeySet: !!ltaKey() },
    onemapToken: null,
    routing: null,
    lta: null,
    hint: null,
  };

  // --- OneMap token ---
  let token = null;
  try {
    token = await getOneMapToken();
    report.onemapToken = { acquired: true, length: String(token).length, ...(tokenExpiry(token) || {}) };
    if (report.onemapToken.expired) report.hint = "The OneMap token has expired. Set ONEMAP_EMAIL + ONEMAP_PASSWORD so the server can mint a fresh one automatically.";
  } catch (err) {
    report.onemapToken = { acquired: false, error: String(err.message || err) };
    report.hint = "OneMap credentials are missing or rejected — routing cannot work until this is fixed.";
    res.status(200).json(report);
    return;
  }

  // --- OneMap routing ---
  const { date, time } = singaporeNow();
  try {
    const url = buildRouteUrl({ start: from, end: to, routeType: "pt", mode: "transit", date, time });
    const attempts = [];
    for (const scheme of ["raw", "bearer"]) {
      const upstream = await fetch(url.toString(), {
        headers: { Authorization: scheme === "bearer" ? `Bearer ${token}` : token },
      });
      const text = await upstream.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* keep raw */ }

      const itineraries = (json && json.plan && json.plan.itineraries) || [];
      const kept = itineraries.map((i) => normalizeItinerary(i, "diagnostic")).filter(Boolean);
      attempts.push({
        authScheme: scheme,
        status: upstream.status,
        contentType: upstream.headers.get("content-type"),
        onemapError: otpError(json),
        itineraries: itineraries.length,
        usableOptions: kept.length,
        sample: kept.slice(0, 2).map((o) => ({ mins: o.mins, fare: o.fare, legs: o.legs })),
        bodyHead: itineraries.length ? undefined : text.slice(0, 400),
      });
      if (upstream.ok && itineraries.length) break;
    }

    report.routing = { request: { from, to, date, time, url: url.toString() }, attempts };

    const best = attempts.find((a) => a.usableOptions > 0);
    if (!report.hint) {
      if (best) report.hint = `Routing works (${best.usableOptions} options via ${best.authScheme} auth).`;
      else if (attempts.some((a) => a.status === 401 || a.status === 403)) report.hint = "OneMap rejected the token (401/403) under both auth schemes — the credentials are wrong or the account lacks routing access.";
      else if (attempts.some((a) => a.onemapError)) report.hint = `OneMap answered but declined the trip: ${attempts.find((a) => a.onemapError).onemapError.msg}`;
      else if (attempts.some((a) => a.status >= 400)) report.hint = "OneMap returned an HTTP error — see status and bodyHead.";
      else report.hint = "OneMap returned no itineraries for this pair. Try coordinates further apart, or a time inside service hours.";
    }
  } catch (err) {
    report.routing = { error: String(err.message || err) };
  }

  // --- LTA reachability ---
  if (ltaKey()) {
    try {
      const data = await ltaFetch(["PCDRealTime", "PlatformCrowdDensityRealTime"], { TrainLine: "NSL" });
      report.lta = { ok: true, stationsReturned: (data.value || []).length };
    } catch (err) {
      report.lta = { ok: false, error: String(err.message || err) };
    }
  } else {
    report.lta = { ok: false, error: "LTA_ACCOUNT_KEY is not configured on the server." };
  }

  res.status(200).json(report);
}
