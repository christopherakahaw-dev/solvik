// Dropping the itineraries that still use a broken line.
//
// OneMap's routing API has no banned-routes parameter — it takes a mode, a walk
// distance, a date and an itinerary count, and nothing else. So a reroute is
// done the only way it can be: ask for more options than we need, then discard
// the ones that run through the disruption. Kept pure and separate from the
// endpoint so the matching can be tested against recorded itineraries.
import { canonicalLine, squashLine as squash } from "../../src/lib/lines.js";

export { canonicalLine };


// Does this option ride the named line, or the named bus service?
export function usesLine(option, line) {
  const code = canonicalLine(line);
  const service = code ? null : squash(line);
  if (!code && !service) return false;
  return (option.transitLegs || []).some((leg) => {
    if (code) return canonicalLine(leg.label) === code || canonicalLine(leg.service) === code;
    // A bus service is matched exactly. Containment would let avoiding 51 drop
    // 510, 151 and 51A along with it.
    return squash(leg.service) === service || squash(leg.label) === `BUS${service}`;
  });
}

// Accepts "NSL", "NSL,410", or a list.
export function parseAvoid(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return [...new Set(list.map((v) => String(v).trim()).filter(Boolean))];
}

export function withoutLines(options, lines) {
  const avoid = parseAvoid(lines);
  if (!avoid.length) return { kept: options, dropped: 0, lines: [] };
  const kept = (options || []).filter((opt) => !avoid.some((line) => usesLine(opt, line)));
  return { kept, dropped: (options || []).length - kept.length, lines: avoid };
}
