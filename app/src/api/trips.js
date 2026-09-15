// Journey options from /api/trip-options. Throws on failure so the caller can
// show an explicit error state rather than substituting invented routes.
export async function getTripOptions(from, to, mode, destName) {
  const params = new URLSearchParams({
    from: `${from[0]},${from[1]}`,
    to: `${to[0]},${to[1]}`,
    mode,
  });
  if (destName) params.set("destName", destName);
  const res = await fetch(`/api/trip-options?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't plan this trip");
  return data.options || [];
}
