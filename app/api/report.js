// Filing a commuter report.
//
// The browser never writes to the reports table — only this function does, with
// the service-role key, and only after triage. That is the whole security model:
// a client holding a valid JWT still cannot insert a report that skipped the
// checks, because the RLS policy grants it no insert at all.
//
// The photo is used and dropped. It is sent here, checked, and never written
// anywhere — no bucket, no retention, no archive of other people's faces.
import { createClient } from "@supabase/supabase-js";
import { locationChecks, verdictFor, parseVision, visionPrompt, VISION_SCHEMA, MAX_PER_HOUR } from "./_lib/triage.js";
import { resolveStopCode, distanceMetres, nearestStop, nearestStopCode } from "./_lib/busStops.js";
import { fromDirectory } from "./_lib/stations.js";
import { demoMode } from "./_lib/demo.js";
import { kindLabel } from "../src/lib/confidence.js";

const POINTS = { crowd: 30, esc: 25, delay: 30, gantry: 20, bus: 20, aircon: 15 };

function bearerToken(req) {
  const header = String(req.headers?.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

// Where the reporter says they are, against where the station actually is.
async function distanceToPlace(code, lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
  const station = fromDirectory(code);
  if (station && Number.isFinite(station.lat)) return distanceMetres(lat, lng, station.lat, station.lng);
  const stop = await nearestStop(lat, lng).catch(() => null);
  return stop && Number.isFinite(stop.distanceM) ? stop.distanceM : Infinity;
}

// Claude checks the photo for consistency with the report — never for truth.
// With no key this returns null and the report rests on the other checks alone,
// which is stated rather than hidden.
async function visionCheck(kind, photo) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !photo) return null;
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(String(photo));
  if (!match) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-opus-5",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: { type: "json_schema", schema: VISION_SCHEMA } },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } },
          { type: "text", text: visionPrompt(kindLabel(kind)) },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`Photo check unavailable (${res.status})`);
  const body = await res.json();
  const text = (body.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return parseVision(text);
}

// Demo builds: a recorded verdict, so the whole path can be shown without a key
// or a network. Marked recorded, like every other recorded answer in the app.
const RECORDED_VISION = {
  depicts: "lift", matchesReport: true, looksLikeTransitStation: true,
  screenOfAScreen: false, reason: "The photo shows a lift with an out-of-service notice.", usable: true,
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return res.status(503).json({ error: "Reporting is not configured on this deployment." });

  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Sign in to file a report." });

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return res.status(401).json({ error: "Your session is no longer valid." });

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { kind, stationName, lat, lng, accuracy, fixAt, capturedAt, photo } = body;
  // A report filed mid-journey names no station — the nav sheet only knows where
  // you are. Resolving it here keeps one triage path instead of two.
  const stationCode = body.stationCode || (await nearestStopCode(Number(lat), Number(lng)).catch(() => null));
  if (!kind || !stationCode) return res.status(400).json({ error: "A report needs a kind, and a place we can find." });

  // How many the account has already filed this hour — the flood gate.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter", auth.user.id)
    .gte("created_at", hourAgo);

  const code = await resolveStopCode(stationCode, lat, lng).catch(() => stationCode);
  const checks = locationChecks({
    fixAt: Number(fixAt),
    accuracy: Number(accuracy),
    distanceM: await distanceToPlace(stationCode, Number(lat), Number(lng)),
    capturedAt: Number(capturedAt),
    recentCount: count || 0,
  });

  let vision = null;
  let visionNote = null;
  try {
    vision = await visionCheck(kind, photo);
    if (!vision && demoMode()) vision = RECORDED_VISION;
    if (!vision) visionNote = "The photo was not checked — no image model is configured on this deployment.";
  } catch (err) {
    if (demoMode()) vision = RECORDED_VISION;
    else visionNote = String(err.message || err);
  }

  const outcome = verdictFor({ checks, vision });
  const points = POINTS[kind] || 10;

  if (outcome.verdict === "rejected") {
    // Nothing is written for a rejected report: it earns no points and does not
    // count towards anyone's corroboration.
    return res.status(200).json({ ...outcome, points: 0, pointsState: "none", vision, visionNote, recorded: vision === RECORDED_VISION });
  }

  const { data: row, error } = await admin
    .from("reports")
    .insert({
      reporter: auth.user.id,
      kind,
      station_code: String(code || stationCode).toUpperCase(),
      station_name: stationName || "",
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      triage: { checks: outcome.checks, vision },
      verdict: "accepted",
      points,
      points_state: "pending",
    })
    .select("id, station_code, kind, created_at")
    .single();
  if (error) return res.status(502).json({ error: "The report could not be filed. Please try again." });

  return res.status(200).json({
    ...outcome,
    id: row.id,
    points,
    // Pending, not credited: the payout waits on someone else agreeing.
    pointsState: "pending",
    vision,
    visionNote,
    recorded: vision === RECORDED_VISION,
    maxPerHour: MAX_PER_HOUR,
  });
}
