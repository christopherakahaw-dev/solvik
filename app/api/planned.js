// Planned works on the network, as opposed to the faults /api/lta reports.
//
// One source today — LTA's adhoc lift maintenance — behind a shape that can
// carry more. If a scheduled-closures feed appears (the organisers' dataset, or
// a future DataMall endpoint), it is added here and the client is unchanged.
import { ltaFetch } from "./_lib/lta.js";
import { parseFacilities, byStation, FACILITIES_PATHS } from "../src/lib/planned.js";
import { serveRecorded } from "./_lib/demo.js";
import { recordedFacilities } from "./_lib/recorded/index.js";

export default async function handler(req, res) {
  try {
    const payload = await ltaFetch(FACILITIES_PATHS);
    const works = byStation(parseFacilities(payload));
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ works });
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    if (serveRecorded(res, { works: byStation(parseFacilities(recordedFacilities)) })) return;
    res.status(msg.includes("not configured") ? 501 : 502).json({ error: msg });
  }
}
