// Proxies OneMap's address/postal-code/building search so the browser never
// talks to onemap.gov.sg directly. Search does not require an API token.
import { oneMapSearch } from "./_lib/onemap.js";

export default async function handler(req, res) {
  const query = req.query?.q ?? new URL(req.url, "http://localhost").searchParams.get("q");
  if (!query || !String(query).trim()) {
    res.status(400).json({ error: "Missing q parameter" });
    return;
  }

  try {
    const results = await oneMapSearch(query);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: String(err && err.message ? err.message : err) });
  }
}
