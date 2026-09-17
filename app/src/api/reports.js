// Filing and reading commuter reports.
//
// Writing goes through /api/report, never straight to Supabase: the table grants
// the browser no insert at all, so triage cannot be skipped by calling the
// database directly. Reading is a plain select, because current reports are
// meant to be seen — that is what filing one is for.
import { getSupabase } from "../lib/supabase";

async function accessToken() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

export async function submitReport(payload) {
  // No client-side gate: the server decides, so there is one place that says
  // whether a report may be filed and one message explaining why not.
  const token = await accessToken();
  const res = await fetch("/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "The report could not be filed.");
  return data;
}

// Read through the grouped view, never the rows: it returns how many distinct
// people reported a thing without returning who they are. Selecting the rows
// directly would hand every reader a per-person id, and a per-person id across
// stations is a movement trace.
export async function loadReportGroups() {
  const supabase = getSupabase();
  if (!supabase) return { groups: [], configured: false };
  const { data, error } = await supabase
    .from("report_groups")
    .select("station_code, station_name, kind, reports, people, lat, lng, last_at")
    .order("last_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return {
    configured: true,
    groups: (data || []).map((row) => ({
      key: `${row.station_code}|${row.kind}`,
      kind: row.kind,
      stationCode: row.station_code,
      stationName: row.station_name || row.station_code,
      ll: [row.lat, row.lng],
      reports: row.reports,
      people: row.people,
      lastAt: new Date(row.last_at).getTime(),
    })),
  };
}

// What the account has filed, and whether it has been corroborated yet. Points
// are pending until someone else says the same thing.
export async function loadMyReports() {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];
  const { data, error } = await supabase
    .from("reports")
    .select("id, kind, station_name, points, points_state, created_at")
    .eq("reporter", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    stationName: row.station_name,
    points: row.points,
    state: row.points_state,
    at: new Date(row.created_at).getTime(),
  }));
}
