// Proxies OneMap's address/postal-code/building search so the browser never
// talks to onemap.gov.sg directly. Search does not require an API token.
export default async function handler(req, res) {
  const query = req.query?.q ?? new URL(req.url, "http://localhost").searchParams.get("q");
  if (!query || !String(query).trim()) {
    res.status(400).json({ error: "Missing q parameter" });
    return;
  }

  const url = new URL("https://www.onemap.gov.sg/api/common/elastic/search");
  url.searchParams.set("searchVal", query);
  url.searchParams.set("returnGeom", "Y");
  url.searchParams.set("getAddrDetails", "Y");
  url.searchParams.set("pageNum", "1");

  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `OneMap search failed (${upstream.status})` });
      return;
    }
    const data = await upstream.json();
    const results = (data.results || []).map((r) => ({
      name: r.BUILDING && r.BUILDING !== "NIL" ? r.BUILDING : r.SEARCHVAL,
      address: r.ADDRESS,
      postal: r.POSTAL !== "NIL" ? r.POSTAL : null,
      lat: Number(r.LATITUDE),
      lng: Number(r.LONGITUDE),
    }));
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: "OneMap search request failed", detail: String(err) });
  }
}
