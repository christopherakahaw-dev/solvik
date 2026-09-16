function singaporeDateTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).reduce((out, part) => {
    if (part.type !== "literal") out[part.type] = part.value;
    return out;
  }, {});
  return {
    date: `${parts.month}-${parts.day}-${parts.year}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

// Journey options from /api/trip-options. Throws on failure so the caller can
// show an explicit error state rather than substituting invented routes.
export async function getTripOptions(from, to, mode, destName) {
  const { date, time } = singaporeDateTime();
  const body = {
    from: `${from[0]},${from[1]}`,
    to: `${to[0]},${to[1]}`,
    mode,
    date,
    time,
  };
  if (destName) body.destName = destName;
  const res = await fetch("/api/trip-options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't plan this trip");
  return data.options || [];
}
