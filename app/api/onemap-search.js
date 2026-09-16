// Proxies OneMap's address/postal-code/building search so the browser never
// talks to onemap.gov.sg directly. Search does not require an API token.
import { oneMapSearch } from "./_lib/onemap.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");

  const query = req.body?.query ?? req.query?.q ?? new URL(req.url, "http://localhost").searchParams.get("q");
  const normalized = String(query || "").trim();
  if (normalized.length < 2 || normalized.length > 120) {
    res.status(400).json({ error: "Search query must be between 2 and 120 characters" });
    return;
  }

  try {
    const results = await oneMapSearch(normalized);
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: String(err && err.message ? err.message : err) });
  }
}
