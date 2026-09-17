// One name for a rail line, whoever is writing it.
//
// LTA's service alerts say "NSL". OneMap's routeShortName is "NS", which
// legLabel() turns back into "NSL". A service message may spell it out. All
// three have to resolve to the same thing, because a line we fail to recognise
// is a line we fail to warn about — and, when rerouting, one we fail to avoid.
const LINE_ALIASES = {
  NSL: ["NS", "NORTHSOUTH"],
  EWL: ["EW", "EASTWEST"],
  CGL: ["CG", "CHANGI", "CHANGIAIRPORT"],
  CCL: ["CC", "CE", "CIRCLE"],
  DTL: ["DT", "DOWNTOWN"],
  NEL: ["NE", "NORTHEAST"],
  TEL: ["TE", "THOMSON", "THOMSONEASTCOAST"],
  BPL: ["BP", "BUKITPANJANG"],
  SLRT: ["SE", "SW", "STC", "SENGKANG"],
  PLRT: ["PE", "PW", "PTC", "PUNGGOL"],
};

export const squashLine = (raw) => String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// The canonical code for a line written any of the ways the feeds write it.
// Returns null for anything that isn't a rail line — a bus service, or the
// "LTA" placeholder a general service message carries.
export function canonicalLine(raw) {
  const key = squashLine(raw);
  if (!key) return null;
  if (LINE_ALIASES[key]) return key;
  for (const [code, aliases] of Object.entries(LINE_ALIASES)) {
    if (aliases.includes(key)) return code;
    // "NSLINE", "DOWNTOWNLINE" — a name with the word LINE still attached.
    if (key.endsWith("LINE") && aliases.includes(key.slice(0, -4))) return code;
  }
  return null;
}

// Do these two names mean the same line? Only ever true for rail: two bus
// services are compared by number elsewhere, where an exact match is wanted.
export function sameLine(a, b) {
  const x = canonicalLine(a);
  return !!x && x === canonicalLine(b);
}
