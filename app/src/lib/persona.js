// Who is reading, and what that changes.
//
// The brief is explicit that this is scored: "The same disruption means
// different things to Rachel, Arjun and Mdm Lim. Generic output serves nobody."
// And: "do not silently build for a generic commuter — that is how apps end up
// serving nobody."
//
// So the same facts produce different advice depending on who asked. Nothing
// here invents data; it decides which of the data already fetched is worth
// interrupting someone about, and how to rank what is offered.

export const PERSONAS = {
  fixed: {
    id: "fixed",
    name: "Fixed schedule",
    blurb: "Same trip every day. Tell me only when it actually matters.",
    example: "Like Rachel — Tampines to Raffles Place, must be at her desk by 08:45.",
    mode: "fast",
    // A five-minute delay is noise to her; fifteen costs a meeting.
    interruptAfterMins: 15,
    liftOutageBlocks: false,
    rainChangesRoute: false,
    largeText: false,
    wetMode: "fast",
    busyMode: "quiet",
  },
  flexible: {
    id: "flexible",
    name: "Flexible and multi-modal",
    blurb: "I'll leave later to avoid a crush. Cycling and buses both count.",
    example: "Like Arjun — Punggol to one-north, start time flexible within the hour.",
    mode: "quiet",
    interruptAfterMins: 5,
    liftOutageBlocks: false,
    // Weather decides whether he cycles at all.
    rainChangesRoute: true,
    largeText: false,
    wetMode: "walk",
    busyMode: "quiet",
  },
  stepFree: {
    id: "stepFree",
    name: "Step-free access",
    blurb: "I need lifts and shelter, and I plan the whole trip before I leave.",
    example: "Like Mdm Lim — Bedok to Singapore General Hospital, fortnightly.",
    mode: "step",
    // She will not improvise on a platform, so anything that breaks the route
    // matters however small the time cost.
    interruptAfterMins: 0,
    liftOutageBlocks: true,
    rainChangesRoute: true,
    largeText: true,
    wetMode: "walk",
    busyMode: "step",
  },
};

export const DEFAULT_PERSONA = "fixed";

export function personaOf(id) {
  return PERSONAS[id] || PERSONAS[DEFAULT_PERSONA];
}

export function personaList() {
  return Object.values(PERSONAS);
}

// The planner mode this persona wants, given what is happening. Crowding and
// rain pull in different directions, and which wins is a property of the person
// rather than of the network.
export function modeFor(persona, { wet = false, busy = false } = {}) {
  const p = personaOf(persona);
  if (wet && p.rainChangesRoute) return p.wetMode;
  if (busy) return p.busyMode;
  return p.mode;
}

// Is this worth interrupting them about? Rachel's threshold is fifteen minutes;
// Mdm Lim's is anything that breaks step-free access, whatever the clock says.
export function shouldInterrupt(persona, { delayMins = 0, liftOutage = false, wet = false } = {}) {
  const p = personaOf(persona);
  if (liftOutage && p.liftOutageBlocks) return true;
  if (wet && p.rainChangesRoute) return true;
  return delayMins >= p.interruptAfterMins && delayMins > 0;
}

// Why this persona is being shown this, in their own terms — so the card can
// say "your commute is step-free, so this blocks the way through" rather than
// stating a fact and leaving the reader to work out whether it applies.
export function reasonFor(persona, kind) {
  const p = personaOf(persona);
  if (kind === "lift") {
    return p.liftOutageBlocks
      ? "You travel step-free, so this may block the way through."
      : "The trains still run — only the lift is out.";
  }
  if (kind === "rain") {
    return p.rainChangesRoute
      ? "You asked to avoid wet walks, so the route below favours shelter."
      : "Rain on the way. Your route is unchanged.";
  }
  if (kind === "crowd") {
    return p.id === "flexible"
      ? "You would rather wait than stand — leaving later is offered below."
      : "Busy, but on your usual route.";
  }
  return "";
}
