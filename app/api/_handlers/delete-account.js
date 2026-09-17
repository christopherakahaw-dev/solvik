import { createClient } from "@supabase/supabase-js";

function bearerToken(req) {
  const header = String(req.headers?.authorization || "");
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method !== "DELETE") {
    res.setHeader("Allow", "DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return res.status(503).json({ error: "Account deletion is not configured." });
  }

  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required." });

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error: userError } = await admin.auth.getUser(token);
  if (userError || !data.user) return res.status(401).json({ error: "Your session is no longer valid." });

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return res.status(500).json({ error: "The account could not be deleted. Please try again." });
  return res.status(200).json({ ok: true });
}
