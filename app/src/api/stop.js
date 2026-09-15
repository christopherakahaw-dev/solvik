// Nearest bus stop to a coordinate, for filing a report against a real stop.
export async function getNearestStop(lat, lng) {
  const res = await fetch(`/api/nearest-stop?lat=${lat}&lng=${lng}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't find your stop");
  return data;
}
